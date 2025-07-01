import { useEffect, useState } from "react";
import ManCard from "../components/ManCard";
import AddSeriesModal from "../components/AddSeriesModal";
import EditSeriesModal from "../components/EditSeriesModal";
import {
  deleteSeries,
  fetchRankedSeriesPaginated,
  searchSeries,
  type RankedSeries,
  type Series,
} from "../api/manApi";
import { useUser } from "../login/UserContext";
import InfiniteScroll from "react-infinite-scroll-component";
import { useSearch } from "../components/SearchContext";
import ShimmerLoader from "../components/ShimmerLoader";

const PAGE_SIZE = 25;

const Home = () => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Series | null>(null);
  const [items, setItems] = useState<RankedSeries[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const { searchTerm } = useSearch();
  const { user } = useUser();
  const isAdmin = user?.role === "ADMIN";

  const loadSeries = async () => {
    if (!hasMore) return;
    setLoading(true);

    try {
      const newItems = await fetchRankedSeriesPaginated(page, PAGE_SIZE);
      setItems((prev) => {
        const newIds = new Set(prev.map((item) => item.id));
        const filtered = newItems.filter((item) => !newIds.has(item.id));
        return [...prev, ...filtered];
      });

      if (newItems.length < PAGE_SIZE) setHasMore(false);
    } catch (err) {
      console.error("Failed to fetch ranked series:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (searchTerm.trim()) {
        try {
          setLoading(true);
          const results = await searchSeries(searchTerm);
          setItems(results);
          setHasMore(false);
        } catch (err) {
          console.error("Search failed:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(true);
        setItems([]);
        setPage(1);
        setHasMore(true);

        try {
          const results = await fetchRankedSeriesPaginated(1, PAGE_SIZE);
          setItems(results);
          if (results.length < PAGE_SIZE) setHasMore(false);
        } catch (err) {
          console.error("Failed to fetch default ranked series:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [searchTerm]);

  useEffect(() => {
    if (!searchTerm) loadSeries();
  }, [page, searchTerm]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this series?")) return;

    try {
      await deleteSeries(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert("Failed to delete.");
      console.error(err);
    }
  };

  return (
    <div className="flex justify-center px-4">
      <div className="w-full max-w-7xl py-6">
        {isAdmin && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 rounded-md font-medium text-gray-800 bg-white/70 backdrop-blur-sm border border-gray-300 shadow-md hover:bg-white hover:shadow-lg hover:text-black transition-all duration-200"
            >
              + Add Series
            </button>
          </div>
        )}

        <InfiniteScroll
          dataLength={items.length}
          next={() => setPage((prev) => prev + 1)}
          hasMore={!searchTerm && hasMore}
          loader={<p className="text-center py-6 text-gray-500">Loading...</p>}
          endMessage={
            <p className="text-center py-6 text-gray-400">
              🎉 You’ve seen everything.
            </p>
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
                />
              ))}
            </div>
          )}
        </InfiniteScroll>

        {showModal && <AddSeriesModal onClose={() => setShowModal(false)} />}
        {editItem && (
          <EditSeriesModal
            id={editItem.id}
            initialData={editItem}
            onClose={() => setEditItem(null)}
            onSuccess={() => {
              setItems([]);
              setPage(1);
              setHasMore(true);
              loadSeries(); // Refresh after edit
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Home;
