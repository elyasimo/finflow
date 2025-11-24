import { NextRequest, NextResponse } from 'next/server';

// This is a placeholder API route for budgets
// Connect to your backend service here

export async function GET(request: NextRequest) {
  try {
    // TODO: Fetch budgets from backend
    // For now, return mock data
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Create budget in backend
    return NextResponse.json({ message: 'Budget created' }, { status: 201 });
  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}
