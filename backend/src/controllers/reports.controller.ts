// @ts-nocheck
import { Request, Response } from 'express';
import { db } from '../db.js';
import { transactions, accounts, categories, budgets, users } from '../db/schema.js';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';

interface ReportOptions {
  type: 'monthly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  includeCharts?: boolean;
  language?: 'de' | 'en';
}

/**
 * Generate a monthly financial report PDF
 */
export async function generateMonthlyReport(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { month, year } = req.query;

    const reportMonth = month ? parseInt(month as string) - 1 : new Date().getMonth();
    const reportYear = year ? parseInt(year as string) : new Date().getFullYear();

    const startDate = startOfMonth(new Date(reportYear, reportMonth));
    const endDate = endOfMonth(new Date(reportYear, reportMonth));

    const pdfBuffer = await generateReportPDF(userId, {
      type: 'monthly',
      startDate,
      endDate,
      language: 'de',
    });

    const filename = `FinFlow_Monatsbericht_${format(startDate, 'yyyy-MM')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
}

/**
 * Generate a yearly financial report PDF
 */
export async function generateYearlyReport(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { year } = req.query;

    const reportYear = year ? parseInt(year as string) : new Date().getFullYear();

    const startDate = startOfYear(new Date(reportYear, 0));
    const endDate = endOfYear(new Date(reportYear, 0));

    const pdfBuffer = await generateReportPDF(userId, {
      type: 'yearly',
      startDate,
      endDate,
      language: 'de',
    });

    const filename = `FinFlow_Jahresbericht_${reportYear}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating yearly report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
}

/**
 * Generate a custom date range report
 */
export async function generateCustomReport(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { startDate: start, endDate: end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    const pdfBuffer = await generateReportPDF(userId, {
      type: 'custom',
      startDate,
      endDate,
      language: 'de',
    });

    const filename = `FinFlow_Bericht_${format(startDate, 'yyyy-MM-dd')}_bis_${format(endDate, 'yyyy-MM-dd')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating custom report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
}

/**
 * Get report data as JSON (for preview)
 */
export async function getReportData(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { type = 'monthly', month, year, startDate: start, endDate: end } = req.query;

    let startDate: Date;
    let endDate: Date;

    if (type === 'monthly') {
      const reportMonth = month ? parseInt(month as string) - 1 : new Date().getMonth();
      const reportYear = year ? parseInt(year as string) : new Date().getFullYear();
      startDate = startOfMonth(new Date(reportYear, reportMonth));
      endDate = endOfMonth(new Date(reportYear, reportMonth));
    } else if (type === 'yearly') {
      const reportYear = year ? parseInt(year as string) : new Date().getFullYear();
      startDate = startOfYear(new Date(reportYear, 0));
      endDate = endOfYear(new Date(reportYear, 0));
    } else {
      if (!start || !end) {
        return res.status(400).json({ error: 'startDate and endDate required for custom reports' });
      }
      startDate = new Date(start as string);
      endDate = new Date(end as string);
    }

    const data = await collectReportData(userId, startDate, endDate);
    res.json(data);
  } catch (error: any) {
    console.error('Error getting report data:', error);
    res.status(500).json({ error: 'Failed to get report data' });
  }
}

/**
 * Export transactions as CSV
 */
export async function exportTransactionsCsv(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { startDate: start, endDate: end, accountId, categoryId } = req.query;

    let query = db
      .select({
        date: transactions.date,
        type: transactions.type,
        description: transactions.description,
        amountCents: transactions.amountCents,
        currency: transactions.currency,
        accountName: accounts.name,
        categoryName: categories.name,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));

    const results = await query;

    // Filter by date if provided
    let filtered = results;
    if (start) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(start as string));
    }
    if (end) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(end as string));
    }

    // Generate CSV
    const headers = ['Datum', 'Typ', 'Beschreibung', 'Betrag', 'Währung', 'Konto', 'Kategorie'];
    const rows = filtered.map(t => [
      format(new Date(t.date), 'dd.MM.yyyy'),
      t.type === 'income' ? 'Einnahme' : t.type === 'expense' ? 'Ausgabe' : 'Umbuchung',
      t.description || '',
      ((t.amountCents || 0) / 100).toFixed(2).replace('.', ','),
      t.currency,
      t.accountName || '',
      t.categoryName || '',
    ]);

    const csv = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const filename = `FinFlow_Transaktionen_${format(new Date(), 'yyyy-MM-dd')}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // Add BOM for Excel UTF-8 compatibility
    res.send('\ufeff' + csv);
  } catch (error: any) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
}

/**
 * Collect all data needed for the report
 */
async function collectReportData(userId: string, startDate: Date, endDate: Date) {
  // Get user info
  const [user] = await db
    .select({ email: users.email, name: users.name, defaultCurrency: users.defaultCurrency })
    .from(users)
    .where(eq(users.id, userId));

  // Get all transactions in period
  const transactionsList = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amountCents: transactions.amountCents,
      currency: transactions.currency,
      date: transactions.date,
      description: transactions.description,
      accountId: transactions.accountId,
      categoryId: transactions.categoryId,
      accountName: accounts.name,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(
      eq(transactions.userId, userId),
      gte(transactions.date, startDate),
      lte(transactions.date, endDate)
    ))
    .orderBy(desc(transactions.date));

  // Calculate totals
  const totalIncome = transactionsList
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amountCents || 0), 0);

  const totalExpenses = transactionsList
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amountCents || 0), 0);

  const netIncome = totalIncome - totalExpenses;

  // Group by category
  const categoryTotals: Record<string, { name: string; amount: number; count: number }> = {};
  transactionsList.filter(t => t.type === 'expense').forEach(t => {
    const catName = t.categoryName || 'Ohne Kategorie';
    if (!categoryTotals[catName]) {
      categoryTotals[catName] = { name: catName, amount: 0, count: 0 };
    }
    categoryTotals[catName].amount += t.amountCents || 0;
    categoryTotals[catName].count += 1;
  });

  const categoryBreakdown = Object.values(categoryTotals)
    .sort((a, b) => b.amount - a.amount);

  // Get accounts summary
  const accountsList = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.archived, false)));

  // Get budgets
  const budgetsList = await db
    .select({
      id: budgets.id,
      name: budgets.name,
      amountCents: budgets.amountCents,
      currency: budgets.currency,
      categoryId: budgets.categoryId,
      categoryName: categories.name,
    })
    .from(budgets)
    .leftJoin(categories, eq(budgets.categoryId, categories.id))
    .where(eq(budgets.userId, userId));

  // Calculate budget usage
  const budgetsWithUsage = budgetsList.map(budget => {
    const spent = transactionsList
      .filter(t => t.type === 'expense' && t.categoryId === budget.categoryId)
      .reduce((sum, t) => sum + (t.amountCents || 0), 0);
    
    return {
      ...budget,
      spent,
      remaining: (budget.amountCents || 0) - spent,
      percentage: budget.amountCents ? Math.round((spent / budget.amountCents) * 100) : 0,
    };
  });

  // Previous period comparison
  const prevStartDate = subMonths(startDate, 1);
  const prevEndDate = subMonths(endDate, 1);

  const prevTransactions = await db
    .select({ type: transactions.type, amountCents: transactions.amountCents })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      gte(transactions.date, prevStartDate),
      lte(transactions.date, prevEndDate)
    ));

  const prevIncome = prevTransactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amountCents || 0), 0);
  const prevExpenses = prevTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amountCents || 0), 0);

  return {
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      label: format(startDate, 'MMMM yyyy', { locale: de }),
    },
    user: {
      email: user?.email,
      name: user?.name,
      currency: user?.defaultCurrency || 'EUR',
    },
    summary: {
      totalIncome,
      totalExpenses,
      netIncome,
      transactionCount: transactionsList.length,
    },
    comparison: {
      incomeChange: prevIncome ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100) : 0,
      expensesChange: prevExpenses ? Math.round(((totalExpenses - prevExpenses) / prevExpenses) * 100) : 0,
    },
    categoryBreakdown,
    budgets: budgetsWithUsage,
    accounts: accountsList,
    topExpenses: transactionsList
      .filter(t => t.type === 'expense')
      .slice(0, 10),
    recentTransactions: transactionsList.slice(0, 20),
  };
}

/**
 * Generate the PDF document
 */
async function generateReportPDF(userId: string, options: ReportOptions): Promise<Buffer> {
  const data = await collectReportData(userId, options.startDate, options.endDate);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50,
      info: {
        Title: `FinFlow Finanzbericht - ${data.period.label}`,
        Author: 'FinFlow',
        Subject: 'Finanzbericht',
      }
    });
    
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const primaryColor = '#6366f1';
    const textColor = '#1e293b';
    const mutedColor = '#64748b';

    // Helper functions
    const formatCurrency = (cents: number) => {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: data.user.currency,
      }).format(cents / 100);
    };

    const drawLine = (y: number) => {
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
    };

    // === HEADER ===
    doc.fontSize(28).fillColor(primaryColor).text('FinFlow', 50, 50);
    doc.fontSize(10).fillColor(mutedColor).text('Finanzbericht', 50, 82);

    doc.fontSize(12).fillColor(textColor).text(data.period.label, 400, 50, { align: 'right' });
    doc.fontSize(9).fillColor(mutedColor).text(
      `${format(options.startDate, 'dd.MM.yyyy')} - ${format(options.endDate, 'dd.MM.yyyy')}`,
      400, 68, { align: 'right' }
    );

    drawLine(100);

    // === SUMMARY BOXES ===
    let y = 120;

    // Income Box
    doc.roundedRect(50, y, 155, 70, 8).fillAndStroke('#f0fdf4', '#22c55e');
    doc.fontSize(10).fillColor('#166534').text('Einnahmen', 60, y + 12);
    doc.fontSize(18).fillColor('#15803d').text(formatCurrency(data.summary.totalIncome), 60, y + 32);
    if (data.comparison.incomeChange !== 0) {
      const arrow = data.comparison.incomeChange > 0 ? '↑' : '↓';
      doc.fontSize(9).text(`${arrow} ${Math.abs(data.comparison.incomeChange)}% vs. Vormonat`, 60, y + 54);
    }

    // Expenses Box
    doc.roundedRect(215, y, 155, 70, 8).fillAndStroke('#fef2f2', '#ef4444');
    doc.fontSize(10).fillColor('#991b1b').text('Ausgaben', 225, y + 12);
    doc.fontSize(18).fillColor('#dc2626').text(formatCurrency(data.summary.totalExpenses), 225, y + 32);
    if (data.comparison.expensesChange !== 0) {
      const arrow = data.comparison.expensesChange > 0 ? '↑' : '↓';
      doc.fontSize(9).text(`${arrow} ${Math.abs(data.comparison.expensesChange)}% vs. Vormonat`, 225, y + 54);
    }

    // Net Box
    const netColor = data.summary.netIncome >= 0 ? '#22c55e' : '#ef4444';
    const netBg = data.summary.netIncome >= 0 ? '#f0fdf4' : '#fef2f2';
    doc.roundedRect(380, y, 165, 70, 8).fillAndStroke(netBg, netColor);
    doc.fontSize(10).fillColor(textColor).text('Netto', 390, y + 12);
    doc.fontSize(18).fillColor(netColor).text(formatCurrency(data.summary.netIncome), 390, y + 32);
    doc.fontSize(9).fillColor(mutedColor).text(`${data.summary.transactionCount} Transaktionen`, 390, y + 54);

    y = 210;

    // === CATEGORY BREAKDOWN ===
    doc.fontSize(14).fillColor(textColor).text('Ausgaben nach Kategorie', 50, y);
    y += 25;

    if (data.categoryBreakdown.length > 0) {
      const maxAmount = data.categoryBreakdown[0].amount;
      
      data.categoryBreakdown.slice(0, 8).forEach((cat, index) => {
        const barWidth = (cat.amount / maxAmount) * 300;
        const percentage = Math.round((cat.amount / data.summary.totalExpenses) * 100);
        
        doc.fontSize(9).fillColor(textColor).text(cat.name, 50, y);
        doc.text(formatCurrency(cat.amount), 350, y, { align: 'right', width: 100 });
        doc.text(`${percentage}%`, 460, y, { align: 'right', width: 40 });
        
        // Progress bar
        doc.roundedRect(50, y + 14, 300, 6, 3).fill('#e2e8f0');
        doc.roundedRect(50, y + 14, Math.max(barWidth, 4), 6, 3).fill(primaryColor);
        
        y += 30;
      });
    } else {
      doc.fontSize(10).fillColor(mutedColor).text('Keine Ausgaben in diesem Zeitraum', 50, y);
      y += 20;
    }

    y += 20;

    // === BUDGETS ===
    if (data.budgets.length > 0) {
      doc.fontSize(14).fillColor(textColor).text('Budget-Übersicht', 50, y);
      y += 25;

      data.budgets.slice(0, 5).forEach(budget => {
        const barColor = budget.percentage > 100 ? '#ef4444' : budget.percentage > 80 ? '#f59e0b' : '#22c55e';
        
        doc.fontSize(9).fillColor(textColor).text(budget.categoryName || budget.name || 'Budget', 50, y);
        doc.text(
          `${formatCurrency(budget.spent)} / ${formatCurrency(budget.amountCents || 0)}`,
          350, y, { align: 'right', width: 150 }
        );
        
        // Progress bar
        doc.roundedRect(50, y + 14, 200, 6, 3).fill('#e2e8f0');
        doc.roundedRect(50, y + 14, Math.min((budget.percentage / 100) * 200, 200), 6, 3).fill(barColor);
        doc.fontSize(8).fillColor(mutedColor).text(`${budget.percentage}%`, 260, y + 10);
        
        y += 30;
      });

      y += 10;
    }

    // === TOP EXPENSES ===
    if (y > 600) {
      doc.addPage();
      y = 50;
    }

    doc.fontSize(14).fillColor(textColor).text('Größte Ausgaben', 50, y);
    y += 25;

    // Table header
    doc.fontSize(8).fillColor(mutedColor);
    doc.text('Datum', 50, y);
    doc.text('Beschreibung', 110, y);
    doc.text('Kategorie', 300, y);
    doc.text('Betrag', 420, y, { align: 'right', width: 75 });
    y += 15;
    drawLine(y);
    y += 10;

    data.topExpenses.slice(0, 10).forEach(tx => {
      doc.fontSize(8).fillColor(textColor);
      doc.text(format(new Date(tx.date), 'dd.MM.yy'), 50, y);
      doc.text((tx.description || '-').substring(0, 30), 110, y);
      doc.text((tx.categoryName || '-').substring(0, 20), 300, y);
      doc.fillColor('#dc2626').text(formatCurrency(tx.amountCents || 0), 420, y, { align: 'right', width: 75 });
      y += 18;
    });

    // === FOOTER ===
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor(mutedColor)
        .text(
          `Erstellt am ${format(new Date(), 'dd.MM.yyyy HH:mm')} • Seite ${i + 1} von ${pageCount}`,
          50, 780, { align: 'center', width: 495 }
        );
    }

    doc.end();
  });
}

export const reportsController = {
  generateMonthlyReport,
  generateYearlyReport,
  generateCustomReport,
  getReportData,
  exportTransactionsCsv,
};
