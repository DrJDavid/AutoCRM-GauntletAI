export function Footer() {
  return (
    <footer className="border-t py-4 px-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} AutoCRM. All rights reserved.
        </p>
        <div className="flex gap-4">
          <a
            href="#"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
