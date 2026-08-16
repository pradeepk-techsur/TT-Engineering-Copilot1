export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="mb-2 text-xs font-mono text-purple-400 uppercase tracking-widest">
          Synthetic POC Data — Not for Production Use
        </div>
        <h1 className="text-3xl font-bold text-gray-100 mb-2">
          TT Engineering Copilot
        </h1>
        <p className="text-gray-400 mb-6">
          EV-INV-800 Demonstration Traction Inverter · Project EVINV-POC-001
        </p>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Foundation Ready</h2>
          <p className="text-gray-400 text-sm">
            Database schema, migrations, and seed data initialized.
            Phase 1 foundation is complete.
          </p>
        </div>
      </div>
    </main>
  );
}
