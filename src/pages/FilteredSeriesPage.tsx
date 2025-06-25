import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  fetchRankedSeriesPaginated,
  deleteSeries,
  type RankedSeries,
  type Series,
} from "../api/manApi";
import ManCard from "../components/ManCard";
import { useUser } from "../login/UserContext";
import EditSeriesModal from "../components/EditSeriesModal";
import InfiniteScroll from "react-infinite-scroll-component";

const PAGE_SIZE = 10;

const FilteredSeriesPage = () => {
  const { seriesType } = useParams();
  const [items, setItems] = useState<RankedSeries[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState<Series | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const { user } = useUser();
  const isAdmin = user?.role === "ADMIN";

  const loadSeries = async (pageToLoad: number) => {
    if (!seriesType || loading) return;

    setLoading(true);
    controllerRef.current?.abort(); // cancel any previous call
    controllerRef.current = new AbortController();

    try {
      const all = await fetchRankedSeriesPaginated(
        pageToLoad,
        PAGE_SIZE,
        seriesType.toUpperCase()
      );

      const filtered = all.filter((s) => s.type === seriesType.toUpperCase());

      setItems((prev) => {
        const ids = new Set(prev.map((i) => i.id));
        const unique = filtered.filter((s) => !ids.has(s.id));
        return [...prev, ...unique];
      });

      if (filtered.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setPage((prev) => prev + 1);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Failed to fetch series:", err);
        alert("Failed to load series");
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset state when type changes
  useEffect(() => {
    if (!seriesType) return;

    setItems([]);
    setPage(1);
    setHasMore(true);

    // Delay call to next tick to prevent double render issues
    setTimeout(() => {
      loadSeries(1);
    }, 0);
  }, [seriesType]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this series?")) return;
    try {
      await deleteSeries(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert("Delete failed");
      console.error(err);
    }
  };

  return (
    <div className="flex justify-center px-4">
      <div className="w-full max-w-7xl py-6">
        <InfiniteScroll
          dataLength={items.length}
          next={() => loadSeries(page)}
          hasMore={hasMore}
          loader={<p className="text-center py-6 text-gray-500">Loading...</p>}
          endMessage={
            <p className="text-center py-6 text-gray-400">
              🎉 You’ve seen everything.
            </p>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map((item) => (
              <ManCard
                key={item.id}
                id={item.id}
                rank={item.rank ?? "-"}
                title={item.title}
                genre={item.genre}
                votes={item.vote_count}
                coverUrl={item.cover_url}
                type={item.type}
                author={item.author}
                artist={item.artist}
                onDelete={handleDelete}
                isAdmin={isAdmin}
                onEdit={() => setEditItem(item)}
              />
            ))}
          </div>
        </InfiniteScroll>

        {editItem && (
          <EditSeriesModal
            id={editItem.id}
            initialData={editItem}
            onClose={() => setEditItem(null)}
            onSuccess={() => {
              setItems([]);
              setPage(1);
              setHasMore(true);
              loadSeries(1);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default FilteredSeriesPage;
