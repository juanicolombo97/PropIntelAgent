import { Admin } from "@/lib/api";

export default async function LeadDetail({ params }: { params: { id: string } }) {
  const leadId = decodeURIComponent(params.id);
  const [lead, messages, visits] = await Promise.all([
    Admin.lead(leadId),
    Admin.messages(leadId),
    Admin.visitsByLead(leadId),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Lead: {leadId}</h1>

      <section className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-medium mb-2">Perfil</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><b>Status:</b> {lead.Status ?? "-"}</div>
          <div><b>Intent:</b> {lead.Intent ?? "-"}</div>
          <div><b>Rooms:</b> {lead.Rooms ?? "-"}</div>
          <div><b>Budget:</b> {lead.Budget ?? "-"}</div>
          <div><b>Neighborhood:</b> {lead.Neighborhood ?? "-"}</div>
          <div><b>Stage:</b> {lead.Stage ?? "-"}</div>
          <div><b>PendingPropertyId:</b> {lead.PendingPropertyId ?? "-"}</div>
          <div className="col-span-2 text-xs text-gray-500"><b>UpdatedAt:</b> {lead.UpdatedAt}</div>
        </div>
      </section>

      <section className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-medium mb-2">Mensajes (recientes)</h2>
        <div className="divide-y text-sm">
          {messages.items?.map((m: any) => (
            <div key={m.Timestamp} className="py-2 flex gap-3">
              <span className={`px-2 py-0.5 rounded ${m.Direction === "in" ? "bg-green-100" : "bg-blue-100"}`}>
                {m.Direction}
              </span>
              <span className="text-gray-500">{new Date(Number(m.Timestamp) * 1000).toLocaleString()}</span>
              <span className="flex-1">{m.Text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-medium mb-2">Visitas</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b"><th>VisitAt</th><th>PropertyId</th><th>Confirmed</th></tr>
          </thead>
          <tbody>
            {visits.items?.map((v: any) => (
              <tr key={v.VisitAt} className="border-b">
                <td className="py-1">{v.VisitAt}</td>
                <td>{v.PropertyId}</td>
                <td>{String(v.Confirmed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
