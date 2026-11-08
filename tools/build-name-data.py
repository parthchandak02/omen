"""Build Omen's name data from the CC0 `babynames` R package (US Social Security records, 1880-2017).

Usage: python3 tools/build-name-data.py babynames.rda lifetables.rda
Needs: pip install rdata pandas
Writes public/data/names/<letter>.json and src/omen/survival.json.
"""
import json
import os
import sys

import pandas as pd
import rdata

AS_OF = 2026
MIN_BIRTHS = 1000
FIRST, LAST = 1880, 2017


def load(path):
    return next(iter(rdata.conversion.convert(rdata.parser.parse_file(path)).values()))


def main(names_path, tables_path):
    births = load(names_path)
    births["year"] = births.year.astype(int)
    totals = births.groupby("name").n.sum()
    kept = births[births.name.isin(totals[totals >= MIN_BIRTHS].index)]
    chunks = {}
    for (name, sex), group in kept.groupby(["name", "sex"]):
        series = group.set_index("year").n.reindex(range(FIRST, LAST + 1), fill_value=0).astype(int).tolist()
        nonzero = [i for i, v in enumerate(series) if v > 0]
        first, last = nonzero[0], nonzero[-1]
        chunks.setdefault(name[0].lower(), {}).setdefault(name, {})[sex] = [FIRST + first] + series[first : last + 1]
    os.makedirs("public/data/names", exist_ok=True)
    for letter, data in chunks.items():
        with open(f"public/data/names/{letter}.json", "w") as handle:
            json.dump(data, handle, separators=(",", ":"), sort_keys=True)

    tables = load(tables_path)
    tables["year"] = tables.year.astype(int)
    tables["x"] = tables.x.astype(int)
    survival = {}
    for sex in ("F", "M"):
        lx = {year: group.set_index("x").lx for year, group in tables[tables.sex == sex].groupby("year")}
        cohorts = sorted(lx)
        values = []
        for year in range(FIRST, LAST + 1):
            age = AS_OF - year
            lo = max(c for c in cohorts if c <= max(year, cohorts[0]))
            hi = min(c for c in cohorts if c >= min(year, cohorts[-1]))
            f = 0 if hi == lo else (year - lo) / (hi - lo)
            alive = lambda c: float(lx[c].get(age, 0.0)) / 100000 if age <= lx[c].index.max() else 0.0
            values.append(round((1 - f) * alive(lo) + f * alive(hi), 5))
        survival[sex] = values
    with open("src/omen/survival.json", "w") as handle:
        json.dump({"asOf": AS_OF, "first": FIRST, **survival}, handle, separators=(",", ":"))
    print(f"{sum(len(c) for c in chunks.values())} names, {len(chunks)} letters")


if __name__ == "__main__":
    main(*sys.argv[1:3])
