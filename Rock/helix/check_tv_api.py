#!/usr/bin/env python3
"""Crawls the TV API and validates every response.
Usage: python3 check_tv_api.py [base_url]"""
import json, sys, time, urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://rock.shepherdchurch.net/api/v2/lava-app/1/tv"
HOST = BASE.split("/api/")[0]
problems, stats = [], {"series": 0, "messages": 0}

def get(path):
    url = path if path.startswith("http") else (HOST + path if path.startswith("/") else BASE + "/" + path)
    err = None
    for _ in range(3):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                body = r.read().decode("utf-8", "replace")
            try:
                return json.loads(body)
            except Exception as e:
                problems.append(f"{url}: invalid JSON ({e}): {body[:300]!r}")
                return None
        except Exception as e:
            err = e
            time.sleep(2)
    problems.append(f"{url}: request failed ({err})")
    return None

def check_message(m, where):
    stats["messages"] += 1
    for k in ("id", "title", "date", "videoUrl", "seriesId"):
        if not m.get(k):
            problems.append(f"{where}: message {m.get('title')!r} missing {k}")
    if m.get("videoUrl") and not str(m["videoUrl"]).startswith("http"):
        problems.append(f"{where}: bad videoUrl {m['videoUrl']!r}")

def check_series_list(items, where):
    for s in items:
        stats["series"] += 1
        if not s.get("url"):
            problems.append(f"{where}: series {s.get('title')!r} has no url")
            continue
        page = get(s["url"])
        if not page:
            continue
        if "error" in page:
            problems.append(f"{s['url']}: {page['error']}")
            continue
        if not page.get("messages"):
            problems.append(f"{s['url']}: no messages")
        for m in page.get("messages", []):
            check_message(m, s["url"])

home = get("home")
if home:
    if "error" in home:
        problems.append(f"home: {home['error']}")
    else:
        print("live:", home.get("live"))
        print("upcoming:", home.get("upcoming"))
        if home.get("hero"):
            check_message(home["hero"], "home hero")
        for row in home.get("rows", []):
            print(f"row {row.get('id')}: {len(row.get('items') or [])} items")
            if row.get("type") == "messages":
                for m in row.get("items", []):
                    check_message(m, f"home row {row.get('id')}")
for ch in ("sermons", "lifegroups"):
    page = get(f"series-list?channel={ch}")
    if page:
        check_series_list(page.get("series", []), f"series-list {ch}")
for ch in ("sermons", "lifegroups"):
    page = get(f"series?id=current&channel={ch}")
    if page and "error" in page:
        problems.append(f"series current {ch}: {page['error']}")

print("checked:", stats)
print("problems:", len(problems))
for p in problems[:60]:
    print(" -", p)
sys.exit(1 if problems else 0)
