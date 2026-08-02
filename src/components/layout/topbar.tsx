"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useCallback, useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Building2, LogOut, Menu, Search, UserRound } from "lucide-react";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getRoleHomePath } from "@/lib/navigation/role-home";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type SearchResult = {
  users: Array<{ id: string; name: string; email: string; role: string }>;
  agencies: Array<{ id: string; name: string; location: string | null; type: string | null }>;
};

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ users: [], agencies: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams();
        if (query.trim()) {
          params.set("q", query.trim());
        }

        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (response.ok) {
          setResults(await response.json());
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Search failed:", error);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [open, query]);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      router.push(path);
    },
    [router],
  );

  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }, [router]);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-card px-3 sm:h-16 sm:gap-4 sm:px-6">
        {onMenuClick && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 lg:hidden"
            onClick={onMenuClick}
            aria-label={tNav("openMenu")}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-muted/50 px-3 text-start text-sm text-muted-foreground transition hover:border-primary/30 hover:bg-card sm:max-w-xl sm:px-4"
          aria-label={t("searchUsersAgencies")}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="hidden flex-1 truncate sm:inline">{t("searchUsersAgencies")}</span>
          <kbd className="hidden rounded border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground md:inline">
            ⌘K
          </kbd>
        </button>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <LocaleSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(buttonVariants({ variant: "outline" }), "h-11 gap-2")}
            >
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">{session?.user?.name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{session?.user?.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {session?.user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => void handleSignOut()}
                >
                  <LogOut className="me-2 h-4 w-4" />
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setQuery("");
          }
        }}
        title={t("omniSearch")}
        shouldFilter={false}
      >
        <CommandInput
          placeholder={t("searchPlaceholder")}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("searching")}
            </div>
          ) : (
            <CommandEmpty>{t("noResults")}</CommandEmpty>
          )}
          {results.users.length > 0 && (
            <CommandGroup heading={t("users")}>
              {results.users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.name} ${user.email}`}
                  onSelect={() =>
                    navigate(
                      user.id === session?.user?.id
                        ? getRoleHomePath(session?.user?.role)
                        : `/dashboard?user=${user.id}`,
                    )
                  }
                >
                  <UserRound className="me-2 h-4 w-4" />
                  <div>
                    <p>{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                      {user.role !== "SALES" && (
                        <span className="ms-1 uppercase">· {user.role}</span>
                      )}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results.users.length > 0 && results.agencies.length > 0 && (
            <CommandSeparator />
          )}
          {results.agencies.length > 0 && (
            <CommandGroup heading={t("agencies")}>
              {results.agencies.map((agency) => (
                <CommandItem
                  key={agency.id}
                  value={`${agency.name} ${agency.location ?? ""}`}
                  onSelect={() => navigate(`/agency/${agency.id}`)}
                >
                  <Building2 className="me-2 h-4 w-4" />
                  <div>
                    <p>{agency.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[agency.type, agency.location].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
