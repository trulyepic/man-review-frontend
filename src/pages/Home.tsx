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
import { Helmet } from "react-helmet";
import CompareManager from "../components/CompareManager";
// import { Link } from "react-router-dom";

const PAGE_SIZE = 25;

const Home = () => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Series | null>(null);
  const [items, setItems] = useState<RankedSeries[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  // const [compareList, setCompareList] = useState<RankedSeries[]>([]);
  const [compareError, setCompareError] = useState<string | null>(null);

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
    if (compareError) {
      const timer = setTimeout(() => setCompareError(null), 3000); // clear after 3s
      return () => clearTimeout(timer);
    }
  }, [compareError]);

  // const toggleCompare = (series: RankedSeries) => {
  //   setCompareList((prev) => {
  //     const exists = prev.find((item) => item.id === series.id);
  //     if (exists) {
  //       setCompareError(null); // Clear error on removal
  //       return prev.filter((item) => item.id !== series.id);
  //     }

  //     if (prev.length >= 4) {
  //       setCompareError("You can only compare up to 4 series.");
  //       return prev;
  //     }

  //     setCompareError(null); // Clear previous error
  //     return [...prev, series];
  //   });
  // };

  // const isSelectedForCompare = (id: number) => {
  //   return compareList.some((item) => item.id === id);
  // };

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
  console.log("Items:", items);
  return (
    <>
      <Helmet>
        <title>Toon Ranks | Top Manga, Manhwa, and Manhua</title>
        <meta
          name="description"
          content="Browse the top-ranked Manga, Manhwa, and Manhua. Vote, review, and explore amazing series on Toon Ranks!"
        />
        <meta
          property="og:title"
          content="Toon Ranks | Top Manga, Manhwa, and Manhua"
        />
        <meta
          property="og:description"
          content="Vote, review, and explore top-rated manga and webtoons!"
        />
        <meta
          property="og:image"
          content="https://toonranks.com/android-chrome-512x512.png"
        />
        <meta property="og:url" content="https://toonranks.com/" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Toon Ranks" />
        <meta
          name="twitter:description"
          content="Discover and rate the best manga, manhwa, and manhua."
        />
        <meta
          name="twitter:image"
          content="https://toonranks.com/android-chrome-512x512.png"
        />

        <link rel="canonical" href="https://toonranks.com/" />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Toon Ranks",
            url: "https://toonranks.com",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://toonranks.com/?search={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          })}
        </script>
      </Helmet>
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

          <CompareManager>
            {({ toggleCompare, isSelectedForCompare }) => (
              <InfiniteScroll
                dataLength={items.length}
                next={() => setPage((prev) => prev + 1)}
                hasMore={!searchTerm && hasMore}
                loader={
                  items.length > 0 ? (
                    <div className="flex justify-center py-6">
                      <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : null
                }
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
                        onCompareToggle={() => toggleCompare(item)}
                        isCompared={isSelectedForCompare(item.id)}
                      />
                    ))}
                  </div>
                )}
              </InfiniteScroll>
            )}
          </CompareManager>
          {/* {compareError && (
            <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 px-4 py-2 rounded shadow-lg z-50">
              {compareError}
            </div>
          )} */}

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
        {/* {compareList.length >= 2 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <Link
              to="/compare"
              state={{ items: compareList }}
              className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition"
            >
              Compare {compareList.length} Series
            </Link>
          </div>
        )} */}
      </div>
    </>
  );
};

export default Home;
