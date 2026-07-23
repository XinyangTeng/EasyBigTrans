# EasyBigTrans

A Snakemake workflow for batch RNA-seq analysis of plant and non-model species
from public SRA data. Designed for re-analyzing many BioProjects across multiple
species with a single command.

## What it does

```
SRA accessions  ─►  fastq  ─►  fastp  ─►  HISAT2  ─►  featureCounts  ─►  CountMatrix.csv
                                                              │
                                                              └─► (optional) eggNOG annotation
                                                                      │
                                                  ─► MultiQC HTML report per project
```

Each project gets its own output directory; species share genome indices.

## Scope

EasyBigTrans starts from `.sra` files you already have on disk and stops at
gene-level count matrices plus optional eggNOG functional annotation.
Downstream differential expression (DESeq2, edgeR) is left to you.

## Requirements

- Linux server, ~64 GB RAM recommended for plant genome indexing
- Miniconda or Mambaforge
- Snakemake ≥ 8.0

```bash
conda create -n easybigtrans -c bioconda -c conda-forge snakemake=8 mamba pandas -y
conda activate easybigtrans
```

All other tools (fasterq-dump, fastp, HISAT2, samtools, featureCounts, eggNOG-mapper,
MultiQC) are installed automatically per rule via Conda.

## Quickstart

1. Clone the repo:

   ```bash
   git clone https://github.com/YOURNAME/EasyBigTrans.git
   cd EasyBigTrans
   ```

2. Edit three files in `config/`:

   - `config.yaml` — output dir, thread counts, eggNOG toggle
   - `projects.tsv` — one row per BioProject, points to a directory of `.sra` files
   - `species.tsv` — paths to genome FASTA, GTF/GFF, and where the HISAT2 index lives

3. Dry-run to check the plan:

   ```bash
   snakemake -n --use-conda
   ```

4. Run:

   ```bash
   snakemake --use-conda --cores 32
   ```

   Add `--config run_eggnog=true` to also generate eggNOG annotations.

## Input layout expected

```
/data/PRJNA327257/SRA/SRR3884688.sra
/data/PRJNA327257/SRA/SRR3884689.sra
/data/PRJNA495025/SRA/SRR7976187.sra
...
```

The `sra_dir` column in `projects.tsv` points to one such directory per project.
All `.sra` files inside are automatically detected as samples.

## Output layout

```
results/
├── PRJNA327257/
│   ├── fastq_trimmed/           # cleaned reads (delete after CountMatrix.csv if you like)
│   ├── bam/                     # sorted + indexed BAMs
│   ├── counts/
│   │   ├── counts.txt           # featureCounts raw output
│   │   └── CountMatrix.csv      # tidy gene × sample matrix
│   ├── qc/fastp/                # per-sample HTML and JSON
│   ├── logs/                    # per-rule logs
│   └── multiqc/multiqc_report.html
├── PRJNA495025/
│   └── ...
└── annotation/                  # only when run_eggnog=true
    └── Solanum_lycopersicum/
        └── eggnog.emapper.annotations
```

## Re-running a subset

Snakemake's targeting works as expected. Examples:

```bash
# Only one project (note the `--` separator before target paths)
snakemake --use-conda --cores 16 -- results/PRJNA327257/counts/CountMatrix.csv

# Force re-quantify after editing the GTF
snakemake --use-conda --cores 16 --forcerun featurecounts
```

## Documentation

- `IMPLEMENTATION.md` — step-by-step setup and debugging guide for first-time users.
- `docs/configuration.md` — full reference for each config field.
- `docs/troubleshooting.md` — common errors and fixes.

## License

MIT
