import { Admin } from "@/lib/api";

async function fetchData() {
  const [newL, qualified] = await Promise.all([
    Admin.leadsByStatus("NEW"),
    Admin.leadsByStatus("QUALIFIED"),
  ]);
  return { newL, qualified };
}

export default async function LeadsPage() {
  const { newL, qualified } = await fetchData();
  const renderTable = (items: any[]) => (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left border-b">
          <th className="py-2">LeadId</th>
          <th>Intent</th><th>Rooms</th><th>Budget</th><th>Neighborhood</th><th>UpdatedAt</th>
        </tr>
      </thead>
      <tbody>
        {items?.items?.map((x: any) => (
          <tr key={x.LeadId} className="border-b hover:bg-gray-50">
            <td className="py-2">
              <a className="text-blue-600 hover:underline" href={`/lead/${encodeURIComponent(x.LeadId)}`}>{x.LeadId}</a>
            </td>
            <td>{x.Intent ?? "-"}</td>
            <td>{x.Rooms ?? "-"}</td>
            <td>{x.Budget ?? "-"}</td>
            <td>{x.Neighborhood ?? "-"}</td>
            <td className="text-xs text-gray-500">{x.UpdatedAt?.slice(0,16) ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Leads</h1>
      <section>
        <h2 className="font-medium mb-2">NEW</h2>
        {renderTable(newL)}
      </section>
      <section>
        <h2 className="font-medium mb-2">QUALIFIED</h2>
        {renderTable(qualified)}
      </section>
    </div>
  );
}
