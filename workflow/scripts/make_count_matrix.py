#!/usr/bin/env python
"""
Convert featureCounts output to a tidy CSV count matrix:
    gene_id, sample1, sample2, ...
Sample names are taken from BAM basenames (strip .sorted.bam).
"""
import sys
import os
import csv


def main(in_path, out_path):
    with open(in_path) as fh, open(out_path, "w", newline="") as out:
        writer = csv.writer(out)
        for line in fh:
            if line.startswith("#"):
                continue
            fields = line.rstrip("\n").split("\t")
            if fields[0] == "Geneid":
                # Header: Geneid Chr Start End Strand Length [bam paths...]
                samples = [os.path.basename(p).replace(".sorted.bam", "") for p in fields[6:]]
                writer.writerow(["gene_id"] + samples)
            else:
                writer.writerow([fields[0]] + fields[6:])


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: make_count_matrix.py counts.txt CountMatrix.csv")
    main(sys.argv[1], sys.argv[2])
