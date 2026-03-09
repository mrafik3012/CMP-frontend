import { Link } from "react-router-dom";
import { PageTitle } from "../../components/common/PageTitle";

export function NotFoundPage() {
  return (
    <>
      <PageTitle title="404 - Page Not Found" />
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-base text-text-primary">
        <div className="text-center">
          <h1 className="text-8xl font-bold text-brand-primary">404</h1>
          <h2 className="mt-4 text-2xl font-semibold text-text-primary">Page not found</h2>
          <p className="mt-2 text-text-secondary">The page you are looking for does not exist.</p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-text-inverse hover:opacity-90"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
