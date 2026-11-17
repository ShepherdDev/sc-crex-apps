#!/usr/bin/env python3
"""Crawls the TV API and validates every response. Usage: python3 check_tv_api.py [base_url]"""
import json, sys, time, urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://rock.shepherdchurch.net/api/v2/lava-app/1/tv"
HOST = BASE.split("/api/")[0]
seen, problems, counts = set(), [], {}

def get(url):
    full = url if url.startswith("http") else HOST + url
    for attempt in range(3):
        try:
            with urllib.request.urlopen(full, timeout=30) as r:
                return r.status, r.headers.get("Content-Type"), r.read().decode("utf-8", "replace")
        except Exception as e:
            err = e
            time.sleep(2)
    return None, None, f"FETCH FAILED: {err}"

def crawl(url, depth=0):
    if url in seen or depth > 4:
        return
    seen.add(url)
    status, ctype, body = get(url)
    try:
        page = json.loads(body)
    except Exception as e:
        problems.append(f"{url}: invalid JSON ({e}) status={status} body={body[:200]!r}")
        return
    if "Error" in page:
        problems.append(f"{url}: {page['Error']}")
        return
    t = page.get("Template")
    counts[t] = counts.get(t, 0) + 1
    data = page.get("Data")
    if t == "Menu":
        for b in data.get("Buttons") or []:
            crawl(b["ActionUrl"], depth + 1)
    elif t == "PosterList":
        items = data.get("Items")
        if not isinstance(items, list):
            problems.append(f"{url}: Items is {items!r}")
            return
        if not items:
            problems.append(f"{url}: empty list")
        for it in items:
            crawl(it["ActionUrl"], depth + 1)
    elif t == "Video":
        if not isinstance(data, str) or not data.startswith("http"):
            problems.append(f"{url}: bad video URL {data!r}")
    elif t != "Image":
        problems.append(f"{url}: unknown template {t!r}")

crawl(BASE + "/home")
crawl(BASE + "/series-list?channel=lifegroups")
print("Content-Type of home:", get(BASE + "/home")[1])
print("Pages checked:", len(seen), counts)
print("Problems:", len(problems))
for p in problems[:50]:
    print(" -", p)
sys.exit(1 if problems else 0)
