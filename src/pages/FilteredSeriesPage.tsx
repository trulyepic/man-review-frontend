import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  fetchRankedSeriesPaginated,
  deleteSeries,
  searchSeries,
  type RankedSeries,
  type Series,
} from "../api/manApi";
import ManCard from "../components/ManCard";
import EditSeriesModal from "../components/EditSeriesModal";
import InfiniteScroll from "react-infinite-scroll-component";
import { useSearch } from "../components/SearchContext";
import ShimmerLoader from "../components/ShimmerLoader";
import CompareManager from "../components/CompareManager";
import { useUser } from "../login/useUser";

const PAGE_SIZE = 25;

const FilteredSeriesPage = () => {
  const { seriesType } = useParams();
  const { searchTerm } = useSearch();
  const [items, setItems] = useState<RankedSeries[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState<Series | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const { user } = useUser();
  const isAdmin = user?.role === "ADMIN";

  const loadSeries = async (pageToLoad: number) => {
    if (!seriesType || loading || !hasMore) return;

    console.log(`[loadSeries] Fetching page ${pageToLoad}...`);

    setLoading(true);

    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    try {
      const all = await fetchRankedSeriesPaginated(
        pageToLoad,
        PAGE_SIZE,
        seriesType.toUpperCase(),
        controllerRef.current.signal
      );

      console.log(`[loadSeries] Received ${all.length} items from API`);

      const ids = new Set(items.map((i) => i.id));
      const unique = all.filter((s) => !ids.has(s.id));

      console.log(`[loadSeries] ${unique.length} new unique items`);

      setItems((prev) => [...prev, ...unique]);

      if (all.length < PAGE_SIZE) {
        console.log("[loadSeries] End of data reached.");
        setHasMore(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Failed to fetch series:", err);
        alert("Failed to load series");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Reset and load default items when type changes
  useEffect(() => {
    if (!seriesType) return;

    // Cancel any in-flight request
    controllerRef.current?.abort();

    setItems([]);
    setPage(1);
    setHasMore(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    const loadInitial = async () => {
      try {
        setLoading(true);
        const all = await fetchRankedSeriesPaginated(
          1,
          PAGE_SIZE,
          seriesType.toUpperCase(),
          controller.signal
        );

        setItems(all);
        setPage(1);
        if (all.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Failed to fetch series:", err);
          alert("Failed to load series");
        }
      } finally {
        setLoading(false);
      }
    };

    if (!searchTerm.trim()) {
      loadInitial();
    }

    // Cleanup on unmount or seriesType change
    return () => {
      controller.abort();
    };
  }, [seriesType]);

  // 🔍 Watch for search term changes
  useEffect(() => {
    if (!seriesType) return;

    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;

    const fetchSearch = async () => {
      try {
        setLoading(true);
        const all = await searchSeries(searchTerm.trim());
        const filtered = all.filter(
          (s) => s.type.toUpperCase() === seriesType.toUpperCase()
        );
        setItems(filtered);
        setHasMore(false); // disable infinite scroll for search
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const resetToDefault = async () => {
      setItems([]);
      setPage(1);
      setHasMore(true);
      try {
        const all = await fetchRankedSeriesPaginated(
          1,
          PAGE_SIZE,
          seriesType.toUpperCase(),
          controller.signal
        );
        setItems(all);
        if (all.length < PAGE_SIZE) setHasMore(false);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Failed to fetch series:", err);
          alert("Failed to load series");
        }
      } finally {
        setLoading(false);
      }
    };

    if (searchTerm.trim()) {
      fetchSearch();
    } else {
      resetToDefault();
    }

    return () => {
      controller.abort();
    };
  }, [searchTerm, seriesType]);

  useEffect(() => {
    if (!searchTerm.trim() && page > 1) {
      console.log(`[useEffect:page] Triggering loadSeries(${page})`);
      loadSeries(page);
    }
  }, [page]);

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
        <CompareManager>
          {({ toggleCompare, isSelectedForCompare }) => (
            <InfiniteScroll
              dataLength={items.length}
              next={() => setPage((prev) => prev + 1)}
              hasMore={!searchTerm && hasMore}
              loader={
                items.length > 0 ? (
                  <p className="text-center py-6 text-gray-500">Loading...</p>
                ) : null
              }
              endMessage={
                !loading && items.length > 0 ? (
                  <p className="text-center py-6 text-gray-400">
                    🎉 You’ve seen everything.
                  </p>
                ) : null
              }
            >
              {items.length === 0 && loading ? (
                <ShimmerLoader />
              ) : (
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
                      avgScore={item.final_score}
                      onDelete={handleDelete}
                      isAdmin={isAdmin}
                      onEdit={() => setEditItem(item)}
                      onCompareToggle={() => toggleCompare(item)}
                      isCompared={isSelectedForCompare(item.id)}
                    />
                  ))}
                </div>
              )}
            </InfiniteScroll>
          )}
        </CompareManager>

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
