# Test data

For a fast end-to-end test, recommended public datasets (all small,
ungzipped < 5 GB):

| Project | Species | Samples | Approx size |
|---------|---------|---------|-------------|
| PRJNA395196 | *Arabidopsis thaliana* | 6 | ~3 GB |
| PRJNA391286 | *Oryza sativa* | 4 | ~4 GB |

To set up a test run:

```bash
# 1. Prefetch SRAs (one-time, outside EasyBigTrans)
mkdir -p /data/PRJNA395196/SRA && cd /data/PRJNA395196/SRA
prefetch SRR5876644 SRR5876645 SRR5876646   # plus the others
mv SRR*/SRR*.sra .

# 2. Download genome + GTF for Arabidopsis (TAIR10) into
#    /genomes/Arabidopsis_thaliana/

# 3. Edit config/projects.tsv and config/species.tsv to add these

# 4. Run
snakemake --use-conda --cores 8
```

Expected runtime on a 16-core / 64 GB server: ~45 minutes including
Conda environment creation. Subsequent runs reuse environments and take
~20 minutes.
