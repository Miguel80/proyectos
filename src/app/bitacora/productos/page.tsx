import { ProductForm } from "@/components/product-form";
import { cardClass } from "@/components/ui";
import { isKind, KIND_LABEL } from "@/lib/bitacora/constants";
import { requireUserOrRedirect } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getProducts } from "@/services/bitacora.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Productos · Bitácora Sensorial" };

export default async function ProductsPage() {
  await requireUserOrRedirect();
  const db = await createClient();
  const products = await getProducts(db);

  return (
    <main className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">Nuevo producto</h1>
        <ProductForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Tus productos</h2>
        {products.length === 0 ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">Todavía no hay productos.</p>
        ) : (
          <ul className="space-y-2">
            {products.map((product) => (
              <li key={product.id} className={cardClass}>
                <p className="font-medium">
                  {product.name}{" "}
                  <span className="text-xs font-normal text-stone-500">
                    {isKind(product.kind) ? KIND_LABEL[product.kind] : product.kind}
                  </span>
                </p>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {[product.origin_country, product.region, product.variety, product.process]
                    .filter(Boolean)
                    .join(" · ") || "Sin detalles"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
