"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Recipe, CookLog } from "@/generated/prisma/client";
import { getRecipeImage } from "@/lib/recipe-images";
import { useWakeLock } from "@/hooks/use-wake-lock";

interface RecipeDetailProps {
  recipe: Recipe & { cookLogs: CookLog[] };
  canEdit?: boolean;
  isOwner?: boolean;
  ownerName?: string;
  isSaved?: boolean;
}

export function RecipeDetail({
  recipe,
  canEdit = false,
  isOwner = true,
  ownerName,
  isSaved: initialIsSaved = false,
}: RecipeDetailProps) {
  const router = useRouter();
  const { isActive: cookModeActive, isSupported: wakeLockSupported, request: requestWakeLock, release: releaseWakeLock } = useWakeLock();

  async function handleToggleCookMode() {
    if (cookModeActive) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
    }
  }

  const highlights: string[] = recipe.highlights
    ? JSON.parse(recipe.highlights)
    : [];
  const ingredients: string[] = recipe.ingredients
    ? JSON.parse(recipe.ingredients)
    : [];
  const steps: string[] = recipe.steps ? JSON.parse(recipe.steps) : [];
  const cuisines: string[] = recipe.cuisineTypes
    ? JSON.parse(recipe.cuisineTypes)
    : [];
  const dishTypes: string[] = recipe.dishTypes
    ? JSON.parse(recipe.dishTypes)
    : [];
  const goodFor: string[] = recipe.goodForTags
    ? JSON.parse(recipe.goodForTags)
    : [];
  const seasons: string[] = recipe.seasonTags
    ? JSON.parse(recipe.seasonTags)
    : [];
  const dietary: string[] = recipe.dietaryTags
    ? JSON.parse(recipe.dietaryTags)
    : [];
  const mainIngredients: string[] = recipe.mainIngredientTags
    ? JSON.parse(recipe.mainIngredientTags)
    : [];
  const allTags = [...cuisines, ...dishTypes, ...goodFor, ...seasons, ...mainIngredients];
  const image = getRecipeImage(recipe);

  // Image editor state
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState(recipe.imageUrl ?? "");
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

  // Save/bookmark state
  const [isSaved, setIsSaved] = useState(initialIsSaved);

  async function handleSaveImage() {
    setSavingImage(true);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: editImageUrl.trim() || null }),
      });
      if (res.ok) {
        setShowImageEditor(false);
        router.refresh();
      }
    } finally {
      setSavingImage(false);
    }
  }

  async function handleRemoveImage() {
    setSavingImage(true);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: null }),
      });
      if (res.ok) {
        setEditImageUrl("");
        setShowImageEditor(false);
        router.refresh();
      }
    } finally {
      setSavingImage(false);
    }
  }

  async function handleToggleSave() {
    const previousState = isSaved;
    setIsSaved(!isSaved);
    try {
      await fetch("/api/saved-recipes", {
        method: previousState ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe.id }),
      });
    } catch {
      setIsSaved(previousState);
    }
  }

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(recipe.isFavorite);

  async function handleToggleFavorite() {
    const newValue = !isFavorite;
    setIsFavorite(newValue);
    try {
      await fetch(`/api/recipes/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: newValue }),
      });
    } catch {
      setIsFavorite(!newValue);
    }
  }

  // Cook log state
  const [showCookForm, setShowCookForm] = useState(false);
  const [cookDate, setCookDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [cookNotes, setCookNotes] = useState("");
  const [cookLogs, setCookLogs] = useState(recipe.cookLogs);
  const [localCookCount, setLocalCookCount] = useState(recipe.cookCount);
  const [submitting, setSubmitting] = useState(false);
  const [favoritePrompt, setFavoritePrompt] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleCookButton() {
    if (recipe.cookCount === 0) {
      // Want to Try: show favorite/discard prompt
      setFavoritePrompt(true);
    } else {
      // Known Delicious: show inline cook form
      setShowCookForm(!showCookForm);
    }
  }

  async function handleFavoriteResponse() {
    setSavingFavorite(true);
    await fetch(`/api/recipes/${recipe.id}/cook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cookedAt: new Date().toISOString(),
        favorite: true,
      }),
    });
    setSavingFavorite(false);
    setFavoritePrompt(false);
    router.refresh();
  }

  async function handleDiscard() {
    setSavingFavorite(true);
    await fetch(`/api/recipes/${recipe.id}/cook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discard: true }),
    });
    setSavingFavorite(false);
    setFavoritePrompt(false);
    setDiscardConfirm(false);
    router.push("/");
  }

  async function handleLogCook() {
    // Optimistic update: close form and increment count immediately
    const optimisticLog = {
      id: `temp-${Date.now()}`,
      recipeId: recipe.id,
      userId: "",
      cookedAt: new Date(cookDate),
      notes: cookNotes.trim() || null,
      createdAt: new Date(),
    } as CookLog;

    setCookLogs((prev) => [optimisticLog, ...prev]);
    setLocalCookCount((c) => c + 1);
    const savedNotes = cookNotes;
    const savedDate = cookDate;
    setCookNotes("");
    setShowCookForm(false);

    try {
      const res = await fetch(`/api/recipes/${recipe.id}/cook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cookedAt: new Date(savedDate).toISOString(),
          notes: savedNotes.trim() || undefined,
        }),
      });
      if (res.ok) {
        const newLog = await res.json();
        setCookLogs((prev) =>
          prev.map((l) => (l.id === optimisticLog.id ? newLog : l))
        );
      } else {
        // Revert on failure
        setCookLogs((prev) => prev.filter((l) => l.id !== optimisticLog.id));
        setLocalCookCount((c) => Math.max(0, c - 1));
      }
    } catch {
      setCookLogs((prev) => prev.filter((l) => l.id !== optimisticLog.id));
      setLocalCookCount((c) => Math.max(0, c - 1));
    }
  }

  async function handleRemoveFromLibrary() {
    setDeleting(true);
    try {
      if (isOwner) {
        await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
      } else {
        await fetch("/api/saved-recipes", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId: recipe.id }),
        });
      }
      router.push("/");
    } catch {
      setDeleting(false);
    }
  }

  async function handleDeleteLog(logId: string) {
    const res = await fetch(`/api/recipes/${recipe.id}/cook`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logId }),
    });
    if (res.ok) {
      setCookLogs((prev) => prev.filter((l) => l.id !== logId));
      setLocalCookCount((c) => Math.max(0, c - 1));
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <a
        href="/"
        className="text-sm text-accent-amber hover:text-accent-amber-light"
      >
        &larr; Back to Library
      </a>

      {/* Hero image */}
      {canEdit ? (
        <button
          type="button"
          onClick={() => setShowImageEditor(!showImageEditor)}
          className="group relative mt-4 h-80 w-full overflow-hidden rounded-xl"
        >
          {image.type === "url" ? (
            <img
              src={image.url}
              alt={recipe.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background: `linear-gradient(135deg, ${image.colors[0]}, ${image.colors[1]})`,
              }}
            />
          )}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-28"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--background))",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
            <span className="rounded-lg bg-black/60 px-3 py-1.5 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              Change Image
            </span>
          </div>
        </button>
      ) : (
        <div className="relative mt-4 h-80 w-full overflow-hidden rounded-xl">
          {image.type === "url" ? (
            <img
              src={image.url}
              alt={recipe.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background: `linear-gradient(135deg, ${image.colors[0]}, ${image.colors[1]})`,
              }}
            />
          )}
          <div
            className="absolute bottom-0 left-0 right-0 h-28"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--background))",
            }}
          />
        </div>
      )}

      {/* Inline image editor */}
      {showImageEditor && canEdit && (
        <div className="mt-4 rounded-xl border border-border bg-background-elevated p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">
            Edit Image
          </h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-foreground-muted">Image URL</label>
              <input
                type="url"
                value={editImageUrl}
                onChange={(e) => {
                  setEditImageUrl(e.target.value);
                  setImagePreviewError(false);
                }}
                placeholder="https://example.com/image.jpg"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50"
              />
            </div>
            {editImageUrl.trim() && (
              <div>
                {imagePreviewError ? (
                  <p className="text-sm text-accent-wine-light">
                    Could not load image — check the URL
                  </p>
                ) : (
                  <img
                    src={editImageUrl.trim()}
                    alt="Preview"
                    onError={() => setImagePreviewError(true)}
                    className="h-32 w-auto rounded-lg object-cover"
                  />
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSaveImage}
                disabled={savingImage}
                className="rounded-lg bg-accent-sage px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-sage-light disabled:opacity-50"
              >
                {savingImage ? "Saving..." : "Save"}
              </button>
              {recipe.imageUrl && (
                <button
                  onClick={handleRemoveImage}
                  disabled={savingImage}
                  className="rounded-lg border border-accent-wine/30 px-4 py-2 text-sm font-medium text-accent-wine-light transition-colors hover:bg-accent-wine/10 disabled:opacity-50"
                >
                  Remove Image
                </button>
              )}
              <button
                onClick={() => {
                  setShowImageEditor(false);
                  setEditImageUrl(recipe.imageUrl ?? "");
                  setImagePreviewError(false);
                }}
                className="text-sm text-foreground-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 -mt-8 flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-foreground">
            {recipe.title}
          </h1>
          {!isOwner && ownerName && (
            <p className="mt-1 text-sm text-accent-sage-light">
              Recipe by {ownerName}
            </p>
          )}
        </div>
        {canEdit && (
          <a
            href={`/recipes/${recipe.id}/edit`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground-muted transition-colors hover:bg-background-hover hover:text-foreground"
          >
            Edit
          </a>
        )}
      </div>

      {/* Go-to signals */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {recipe.rating != null && (
          <span className="text-accent-copper">
            {"★".repeat(recipe.rating)}
            {"☆".repeat(5 - recipe.rating)}
          </span>
        )}
        <button
          onClick={handleCookButton}
          className="rounded-lg bg-accent-sage/20 px-3 py-1 text-sm text-accent-sage-light transition-colors hover:bg-accent-sage/30"
        >
          Cooked it! ({localCookCount})
        </button>
        {isOwner && (
          <button
            onClick={handleToggleFavorite}
            className="text-sm text-foreground-muted transition-colors hover:text-accent-copper"
          >
            {isFavorite ? "★ Favorited" : "☆ Favorite"}
          </button>
        )}
        {!isOwner && (
          <button
            onClick={handleToggleSave}
            className={`rounded-lg px-3 py-1 text-sm transition-colors ${
              isSaved
                ? "bg-accent-amber/20 text-accent-amber-light hover:bg-accent-amber/30"
                : "bg-accent-amber/10 text-foreground-muted hover:bg-accent-amber/20 hover:text-accent-amber-light"
            }`}
          >
            {isSaved ? "Saved to Want to Try" : "Save to Want to Try"}
          </button>
        )}
        {wakeLockSupported && (
          <button
            onClick={handleToggleCookMode}
            className={`rounded-lg px-3 py-1 text-sm transition-colors ${
              cookModeActive
                ? "bg-accent-copper/20 text-accent-copper-light hover:bg-accent-copper/30"
                : "bg-background-elevated text-foreground-muted border border-border hover:bg-background-hover hover:text-foreground"
            }`}
          >
            {cookModeActive ? "🔥 Cook Mode On" : "Cook Mode"}
          </button>
        )}
      </div>

      {/* Cook Mode indicator banner */}
      {cookModeActive && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-accent-copper/10 border border-accent-copper/20 px-3 py-2 text-sm text-accent-copper-light">
          <span>Screen will stay awake while you cook.</span>
          <button
            onClick={releaseWakeLock}
            className="ml-auto text-xs text-foreground-muted hover:text-foreground"
          >
            Turn off
          </button>
        </div>
      )}

      {/* Inline cook form */}
      {showCookForm && (
        <div className="mt-4 rounded-xl border border-border bg-background-elevated p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">
            Log a Cook
          </h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-foreground-muted">Date</label>
              <input
                type="date"
                value={cookDate}
                onChange={(e) => setCookDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-foreground-muted">
                Notes (optional)
              </label>
              <textarea
                value={cookNotes}
                onChange={(e) => setCookNotes(e.target.value)}
                placeholder="How did it turn out? Any tweaks?"
                rows={2}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLogCook}
                disabled={submitting}
                className="rounded-lg bg-accent-sage px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-sage-light disabled:opacity-50"
              >
                {submitting ? "Logging..." : "Log It"}
              </button>
              <button
                onClick={() => {
                  setShowCookForm(false);
                  setCookNotes("");
                }}
                className="text-sm text-foreground-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Favorite/discard prompt modal (Want to Try recipes) */}
      {favoritePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-xl border border-border bg-background-elevated p-6 shadow-xl">
            <button
              onClick={() => { setFavoritePrompt(false); setDiscardConfirm(false); }}
              className="absolute top-3 right-3 text-foreground-muted transition-colors hover:text-foreground"
            >
              &times;
            </button>
            {discardConfirm ? (
              <>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                  Are you sure?
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  This will remove <span className="font-medium text-foreground">{recipe.title}</span> from your library.
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    disabled={savingFavorite}
                    onClick={handleDiscard}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    Yes, Remove It
                  </button>
                  <button
                    disabled={savingFavorite}
                    onClick={() => setDiscardConfirm(false)}
                    className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-background-hover hover:text-foreground disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
                  Nice! You cooked it.
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  Add <span className="font-medium text-foreground">{recipe.title}</span> to your Known Favorites?
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    disabled={savingFavorite}
                    onClick={handleFavoriteResponse}
                    className="flex-1 rounded-lg bg-accent-amber px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-amber-light disabled:opacity-50"
                  >
                    Yes, Add to Favorites
                  </button>
                  <button
                    disabled={savingFavorite}
                    onClick={() => setDiscardConfirm(true)}
                    className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-background-hover hover:text-foreground disabled:opacity-50"
                  >
                    No, Discard
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Linked recipe: external link */}
      {recipe.recipeType === "linked" && recipe.url && (
        <div className="mt-6">
          <a
            href={recipe.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-accent-amber px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-amber-light"
          >
            Open Original Recipe &rarr;
          </a>
        </div>
      )}

      {recipe.descriptionShort && (
        <p className="mt-6 text-foreground-muted">{recipe.descriptionShort}</p>
      )}

      {/* Meta info: time, servings, dietary */}
      {(recipe.totalTimeMinutes || recipe.prepTimeMinutes || recipe.cookTimeMinutes || recipe.servings || dietary.length > 0) && (
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-foreground-muted">
          {recipe.totalTimeMinutes ? (
            <span className="rounded-lg bg-background-elevated px-3 py-1 border border-border">
              {recipe.totalTimeMinutes} min total
            </span>
          ) : (
            <>
              {recipe.prepTimeMinutes && (
                <span className="rounded-lg bg-background-elevated px-3 py-1 border border-border">
                  {recipe.prepTimeMinutes} min prep
                </span>
              )}
              {recipe.cookTimeMinutes && (
                <span className="rounded-lg bg-background-elevated px-3 py-1 border border-border">
                  {recipe.cookTimeMinutes} min cook
                </span>
              )}
            </>
          )}
          {recipe.servings && (
            <span className="rounded-lg bg-background-elevated px-3 py-1 border border-border">
              Serves {recipe.servings}
            </span>
          )}
          {dietary.map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-accent-sage/10 px-3 py-1 text-accent-sage-light border border-accent-sage/20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-surface-glass px-2.5 py-0.5 text-xs text-foreground-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {highlights.length > 0 && (
        <div className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-foreground">
            Highlights
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-foreground-muted">
            {highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {ingredients.length > 0 && (
        <div className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-foreground">
            Ingredients
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-foreground-muted">
            {ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
        </div>
      )}

      {steps.length > 0 && (
        <div className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-foreground">
            Steps
          </h2>
          <ol className="mt-3 list-inside list-decimal space-y-2.5 text-foreground-muted">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Cook History */}
      {cookLogs.length > 0 && (
        <div className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-foreground">
            Cook History
          </h2>
          <div className="mt-3 space-y-3">
            {cookLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between rounded-lg border border-border bg-background-elevated p-3"
              >
                <div>
                  <span className="text-sm font-medium text-accent-amber-light">
                    {new Date(log.cookedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {log.notes && (
                    <p className="mt-1 text-sm text-foreground-muted">
                      {log.notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteLog(log.id)}
                  className="ml-3 text-sm text-foreground-muted hover:text-accent-wine-light"
                  title="Remove this entry"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOwner && recipe.personalNotes && (
        <div className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-foreground">
            Personal Notes
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-foreground-muted">
            {recipe.personalNotes}
          </p>
        </div>
      )}

      {/* Remove from library */}
      {(isOwner || isSaved) && (
        <div className="mt-12 border-t border-border pt-6 pb-4">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-foreground-muted transition-colors hover:text-accent-wine-light"
          >
            Remove from Library
          </button>
        </div>
      )}

      {/* Remove confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-xl border border-border bg-background-elevated p-6 shadow-xl">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-3 right-3 text-foreground-muted transition-colors hover:text-foreground"
            >
              &times;
            </button>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
              Remove from Library?
            </h3>
            <p className="mt-2 text-sm text-foreground-muted">
              {isOwner ? (
                <>This will permanently delete <span className="font-medium text-foreground">{recipe.title}</span> and all its cook history.</>
              ) : (
                <>This will remove <span className="font-medium text-foreground">{recipe.title}</span> from your Want to Try list.</>
              )}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                disabled={deleting}
                onClick={handleRemoveFromLibrary}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Removing..." : "Yes, Remove It"}
              </button>
              <button
                disabled={deleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-background-hover hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
