import { useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchRankedSeriesPaginated,
  deleteSeries,
  searchSeries,
  getMyReadingLists, // ✅ NEW
  type RankedSeries,
  type Series,
  type ReadingList, // ✅ NEW
} from "../api/manApi";
import ManCard from "../components/ManCard";
import EditSeriesModal from "../components/EditSeriesModal";
import InfiniteScroll from "react-infinite-scroll-component";
import { useSearch } from "../components/SearchContext";
import ShimmerLoader from "../components/ShimmerLoader";
import CompareManager from "../components/CompareManager";
import { useUser } from "../login/useUser";
import ReadingListModal from "../components/ReadingListModal";
import { isRequestCanceled } from "../api/client";
import GenreStrip from "../components/GenreStrip";

const PAGE_SIZE = 25;

const FilteredSeriesPage = () => {
  const { seriesType } = useParams();
  // const { searchTerm } = useSearch();
  const { searchTerm, setSearchTerm } = useSearch();

  const [items, setItems] = useState<RankedSeries[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState<Series | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const { user } = useUser();
  const isAdmin = user?.role === "ADMIN";

  // 🔽 Reading list state (same as Home)
  const [showListModal, setShowListModal] = useState(false);
  const [modalSeriesId, setModalSeriesId] = useState<number | undefined>(
    undefined
  );
  const [myLists, setMyLists] = useState<ReadingList[] | null>(null);

  // const normalizeGenre = (g: string) =>
  //   g
  //     .split(" ")
  //     .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
  //     .join(" ")
  //     .replace(/\bSci-fi\b/gi, "Sci-Fi");

  // // Build unique, sorted genre list from currently loaded items
  // const derivedGenres = useMemo(() => {
  //   const set = new Set<string>();
  //   for (const it of items) {
  //     if (!it?.genre) continue;
  //     // support comma-separated genres like "Action, Thriller"
  //     const pieces = String(it.genre)
  //       .split(",")
  //       .map((s) => normalizeGenre(s.trim()))
  //       .filter(Boolean);
  //     pieces.forEach((p) => set.add(p));
  //   }
  //   return Array.from(set).sort((a, b) => a.localeCompare(b));
  // }, [items]);

  // // Determine active genre from searchTerm if it matches one of the derived genres
  // const activeGenre =
  //   derivedGenres.find(
  //     (g) => g.toLowerCase() === searchTerm.trim().toLowerCase()
  //   ) || null;

  const normalizeGenre = (g: string) =>
    g
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(" ")
      .replace(/\bSci-fi\b/gi, "Sci-Fi");

  const activeGenre = useMemo(() => {
    const s = searchTerm.trim();
    return s ? normalizeGenre(s) : null;
  }, [searchTerm]);

  const derivedGenres = useMemo(() => {
    const set = new Set<string>();

    // pull from items
    for (const it of items) {
      if (!it?.genre) continue;
      String(it.genre)
        .split(",")
        .map((s) => normalizeGenre(s.trim()))
        .filter(Boolean)
        .forEach((p) => set.add(p));
    }

    // ensure the selected genre appears even if no items match in this type
    if (activeGenre) set.add(activeGenre);

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items, activeGenre]);

  // Fetch lists when user present (same as Home)
  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!user) {
        setMyLists(null);
        return;
      }
      try {
        const res = await getMyReadingLists();
        if (!ignore) setMyLists(res);
      } catch {
        if (!ignore) setMyLists([]);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [user]);

  const canCreateMoreLists = !!user && (myLists?.length ?? 0) < 2;

  const inAnyListIds = new Set(
    (myLists ?? []).flatMap((l) => l.items?.map((it) => it.series_id) ?? [])
  );

  const openCreateListOnly = () => {
    setModalSeriesId(undefined); // create-only mode
    setShowListModal(true);
  };

  const openAddSeriesToList = (seriesId: number) => {
    setModalSeriesId(seriesId); // add-this-series mode
    setShowListModal(true);
  };

  const handleModalDone = async () => {
    if (user) {
      try {
        const res = await getMyReadingLists();
        setMyLists(res);
      } catch (err) {
        console.error("Failed to refresh reading lists:", err);
        alert("Couldn't update your reading lists. Please try again.");
      }
    }
  };
  // 🔼 Reading list state

  const loadSeries = async (pageToLoad: number) => {
    if (!seriesType || loading || !hasMore) return;
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

      const ids = new Set(items.map((i) => i.id));
      const unique = all.filter((s) => !ids.has(s.id));
      setItems((prev) => [...prev, ...unique]);

      if (all.length < PAGE_SIZE) setHasMore(false);
    } catch (err: unknown) {
      if (!isRequestCanceled(err)) {
        console.error("Failed to fetch series:", err);
        alert("Failed to load series");
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset when type changes
  useEffect(() => {
    if (!seriesType) return;

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
        if (all.length < PAGE_SIZE) setHasMore(false);
      } catch (err: unknown) {
        if (!isRequestCanceled(err)) {
          console.error("Failed to fetch series:", err);
          alert("Failed to load series");
        }
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
    // if (!searchTerm.trim()) loadInitial();

    return () => controller.abort();
  }, [seriesType]);

  // Search handling
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
        setHasMore(false);
      } catch (err) {
        if (!isRequestCanceled(err)) {
          console.error("Search failed:", err);
          alert("Failed to load series");
        }
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
        if (!isRequestCanceled(err)) {
          console.error("Failed to fetch series:", err);
          alert("Failed to load series");
        }
      } finally {
        setLoading(false);
      }
    };

    if (searchTerm.trim()) fetchSearch();
    else resetToDefault();

    return () => controller.abort();
  }, [searchTerm, seriesType]);

  useEffect(() => {
    if (!searchTerm.trim() && page > 1) loadSeries(page);
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
    <>
      <GenreStrip
        genres={derivedGenres}
        active={activeGenre}
        onSelect={(g) => setSearchTerm(g ?? "")}
      />

      <div className="flex justify-center px-4">
        <div className="w-full max-w-7xl py-6">
          {/* Toolbar – same as Home */}
          {canCreateMoreLists && (
            <div className="flex justify-start mb-4">
              <button
                onClick={openCreateListOnly}
                className="px-5 py-2.5 rounded-md font-medium text-blue-800 bg-blue-100 border border-blue-300 shadow hover:bg-blue-200 transition-all duration-200"
              >
                + Create Reading List
              </button>
            </div>
          )}

          <CompareManager>
            {({ toggleCompare, isSelectedForCompare }) => (
              <InfiniteScroll
                dataLength={items.length}
                next={() => setPage((prev) => prev + 1)}
                hasMore={!searchTerm.trim() && hasMore}
                loader={
                  items.length > 0 ? (
                    <p className="text-center py-6 text-gray-500">Loading...</p>
                  ) : null
                }
                endMessage={
                  !loading && items.length > 0 ? (
                    <p className="text-center py-6 text-gray-400">
                      🎉 You’ve seen everything, new series added periodically.
                    </p>
                  ) : null
                }
              >
                {/* Loading placeholder when list is empty */}
                {items.length === 0 && loading ? <ShimmerLoader /> : null}

                {/* EMPTY STATE (keeps selected genre; doesn't reset it) */}
                {items.length === 0 && !loading ? (
                  <div className="py-12 text-center text-gray-600">
                    <p className="mb-3">
                      {activeGenre
                        ? `No ${
                            seriesType?.toUpperCase() ?? ""
                          } titles found for “${activeGenre}”.`
                        : `No ${seriesType?.toUpperCase() ?? ""} titles found.`}
                    </p>
                    {activeGenre && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="inline-flex items-center px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800"
                      >
                        Clear genre filter
                      </button>
                    )}
                  </div>
                ) : null}

                {/* GRID */}
                {items.length > 0 ? (
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
                        onAddToReadingList={
                          user ? () => openAddSeriesToList(item.id) : undefined
                        }
                        isInReadingList={inAnyListIds.has(item.id)}
                        status={item.status}
                      />
                    ))}
                  </div>
                ) : null}
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

          {/* Reading list modal (same as Home) */}
          <ReadingListModal
            open={showListModal}
            onClose={() => setShowListModal(false)}
            seriesId={modalSeriesId}
            onDone={handleModalDone}
          />
        </div>
      </div>
    </>
  );
};

export default FilteredSeriesPage;
