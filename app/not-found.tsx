import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        {/* 404 Icon */}
        <div className="mx-auto w-32 h-32 rounded-full bg-muted flex items-center justify-center">
          <span className="text-5xl font-bold text-muted-foreground">404</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="text-muted-foreground">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Go Home
          </Link>
        </div>

        {/* FinFlow Branding */}
        <div className="pt-8 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-semibold">FinFlow</span>
          </div>
        </div>
      </div>
    </div>
  );
}
