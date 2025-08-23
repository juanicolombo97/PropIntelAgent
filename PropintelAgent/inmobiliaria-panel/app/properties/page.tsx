import { Admin } from "@/lib/api";

async function getData(neighborhood?: string) {
  return Admin.properties(neighborhood);
}

export default async function PropertiesPage({ searchParams }: { searchParams: { neighborhood?: string } }) {
  const neighborhood = searchParams?.neighborhood;
  const data = await getData(neighborhood);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Propiedades</h1>

      <form action="/properties" className="flex gap-2">
        <input name="neighborhood" placeholder="Filtrar por barrio" defaultValue={neighborhood} className="border px-2 py-1 rounded" />
        <button className="px-3 py-1 rounded bg-gray-900 text-white">Filtrar</button>
      </form>

      <CreatePropertyForm />

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">ID</th><th>Title</th><th>Neighborhood</th><th>Rooms</th><th>Price</th><th>Status</th><th>URL</th><th></th>
          </tr>
        </thead>
        <tbody>
          {data.items?.map((p: any) => (
            <tr key={p.PropertyId} className="border-b">
              <td className="py-2">{p.PropertyId}</td>
              <td>{p.Title}</td>
              <td>{p.Neighborhood}</td>
              <td>{p.Rooms}</td>
              <td>${p.Price}</td>
              <td>{p.Status}</td>
              <td><a className="text-blue-600 hover:underline" href={p.URL} target="_blank">link</a></td>
              <td><EditPriceForm id={p.PropertyId} current={p.Price} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreatePropertyForm() {
  async function action(formData: FormData) {
    "use server";
    const payload = {
      PropertyId: String(formData.get("PropertyId")),
      Title: String(formData.get("Title")),
      Neighborhood: String(formData.get("Neighborhood")),
      Rooms: Number(formData.get("Rooms")),
      Price: Number(formData.get("Price")),
      Status: "ACTIVE",
      URL: String(formData.get("URL") || ""),
    };
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  }

  return (
    <form action={action} className="bg-white p-4 rounded-lg shadow grid grid-cols-6 gap-2 text-sm">
      <input name="PropertyId" placeholder="PropertyId" className="border px-2 py-1 rounded col-span-2" required />
      <input name="Title" placeholder="Title" className="border px-2 py-1 rounded col-span-2" required />
      <input name="Neighborhood" placeholder="Neighborhood" className="border px-2 py-1 rounded" required />
      <input name="Rooms" type="number" placeholder="Rooms" className="border px-2 py-1 rounded" required />
      <input name="Price" type="number" placeholder="Price" className="border px-2 py-1 rounded" required />
      <input name="URL" placeholder="URL" className="border px-2 py-1 rounded col-span-3" />
      <button className="px-3 py-1 rounded bg-green-600 text-white">Crear</button>
    </form>
  );
}

function EditPriceForm({ id, current }: { id: string; current: number }) {
  async function action(formData: FormData) {
    "use server";
    const price = Number(formData.get("Price"));
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/properties/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Price: price }),
      cache: "no-store",
    });
  }
  return (
    <form action={action} className="flex gap-2">
      <input name="Price" type="number" defaultValue={current} className="border px-2 py-1 rounded w-24" />
      <button className="px-3 py-1 rounded bg-blue-600 text-white">Guardar</button>
    </form>
  );
}
