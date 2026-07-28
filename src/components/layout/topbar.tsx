"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Building2, LogOut, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
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

type SearchResult = {
  users: Array<{ id: string; name: string; email: string; role: string }>;
  agencies: Array<{ id: string; name: string; location: string | null; type: string | null }>;
};

export function Topbar() {
  const router = useRouter();
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

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 w-full max-w-xl items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-left text-sm text-slate-500 transition hover:border-slate-300 hover:bg-white"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1">Search users and agencies…</span>
          <kbd className="hidden rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-400 sm:inline">
            ⌘K
          </kbd>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" className="gap-2">
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">{session?.user?.name}</span>
            </Button>
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
                className="text-rose-600 focus:text-rose-600"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <CommandDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setQuery("");
          }
        }}
        title="Omni Search"
        shouldFilter={false}
      >
        <CommandInput
          placeholder="Search by name, email, or agency…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Searching…
            </div>
          ) : (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {results.users.length > 0 && (
            <CommandGroup heading="Users">
              {results.users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.name} ${user.email}`}
                  onSelect={() => navigate(`/dashboard?user=${user.id}`)}
                >
                  <UserRound className="mr-2 h-4 w-4" />
                  <div>
                    <p>{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results.users.length > 0 && results.agencies.length > 0 && (
            <CommandSeparator />
          )}
          {results.agencies.length > 0 && (
            <CommandGroup heading="Agencies">
              {results.agencies.map((agency) => (
                <CommandItem
                  key={agency.id}
                  value={`${agency.name} ${agency.location ?? ""}`}
                  onSelect={() => navigate(`/agency/${agency.id}`)}
                >
                  <Building2 className="mr-2 h-4 w-4" />
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
