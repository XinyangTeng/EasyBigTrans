#!/usr/bin/env python
"""
Extract splice sites and exons from a GTF/GFF file.
Reimplements the logic of HISAT2's extract_splice_sites.py / extract_exons.py
so the workflow does not need to locate the HISAT2 source tree.
"""
import argparse
import sys
from collections import defaultdict


def parse_gtf_attr(field, key):
    for kv in field.split(";"):
        kv = kv.strip()
        if kv.startswith(key):
            return kv.split('"')[1] if '"' in kv else kv.split("=")[-1].strip()
    return None


def read_exons(path):
    """Yield (transcript_id, chrom, start, end, strand) for every exon."""
    with open(path) as fh:
        for line in fh:
            if not line.strip() or line.startswith("#"):
                continue
            f = line.rstrip("\n").split("\t")
            if len(f) < 9 or f[2] != "exon":
                continue
            tid = parse_gtf_attr(f[8], "transcript_id") or parse_gtf_attr(f[8], "Parent")
            if tid is None:
                continue
            # GTF is 1-based inclusive; convert to 0-based half-open.
            yield tid, f[0], int(f[3]) - 1, int(f[4]), f[6]


def write_exons(exon_iter, out_path):
    seen = set()
    with open(out_path, "w") as out:
        for _, chrom, start, end, strand in exon_iter:
            key = (chrom, start, end, strand)
            if key in seen:
                continue
            seen.add(key)
            out.write(f"{chrom}\t{start}\t{end}\t{strand}\n")


def write_splice_sites(exon_iter, out_path):
    transcripts = defaultdict(list)
    chrom_strand = {}
    for tid, chrom, start, end, strand in exon_iter:
        transcripts[tid].append((start, end))
        chrom_strand[tid] = (chrom, strand)

    sites = set()
    for tid, exons in transcripts.items():
        exons.sort()
        chrom, strand = chrom_strand[tid]
        for i in range(len(exons) - 1):
            donor_end = exons[i][1]            # 0-based half-open end of exon
            acceptor_start = exons[i + 1][0]   # 0-based start of next exon
            sites.add((chrom, donor_end, acceptor_start, strand))

    with open(out_path, "w") as out:
        for chrom, d, a, strand in sorted(sites):
            out.write(f"{chrom}\t{d}\t{a}\t{strand}\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("gtf")
    ap.add_argument("--splice-sites", required=True)
    ap.add_argument("--exons", required=True)
    args = ap.parse_args()

    exons = list(read_exons(args.gtf))
    if not exons:
        sys.exit(f"No exon features found in {args.gtf}. Check format.")
    write_exons(iter(exons), args.exons)
    write_splice_sites(iter(exons), args.splice_sites)


if __name__ == "__main__":
    main()
