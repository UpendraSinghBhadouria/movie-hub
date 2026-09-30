export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MovieHub. Created with ❤️ by{" "}
          <span className="font-medium text-foreground">
            Upendra Singh Bhadouria
          </span>
          .
        </p>
      </div>
    </footer>
  );
}
