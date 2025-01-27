import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface AgentLayoutProps {
  children: React.ReactNode;
}

export function AgentLayout({ children }: AgentLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <aside className="hidden md:block w-64">
          <Sidebar />
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
