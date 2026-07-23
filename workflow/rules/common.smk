# Load sample/project tables and define helper functions used by all rules.

import os
import glob
import pandas as pd
from pathlib import Path

WORKDIR  = config["workdir"]
PROJECTS = pd.read_csv(config["projects"], sep="\t", dtype=str).set_index("project", drop=False)
SPECIES  = pd.read_csv(config["species"],  sep="\t", dtype=str).set_index("species",  drop=False)


def _scan_sra(sra_dir):
    """Return list of SRA accessions (file stems) found in a directory."""
    if not os.path.isdir(sra_dir):
        raise FileNotFoundError(f"sra_dir does not exist: {sra_dir}")
    return sorted(Path(p).stem for p in glob.glob(os.path.join(sra_dir, "*.sra")))


def _build_sample_table():
    """Expand projects.tsv into a (project, sample, species, layout, sra_path) table."""
    rows = []
    for project, row in PROJECTS.iterrows():
        sra_dir = row["sra_dir"]
        for sample in _scan_sra(sra_dir):
            rows.append({
                "project":  project,
                "sample":   sample,
                "species":  row["species"],
                "layout":   row["layout"],
                "sra_path": os.path.join(sra_dir, f"{sample}.sra"),
            })
    if not rows:
        raise ValueError("No .sra files found. Check sra_dir in projects.tsv.")
    return pd.DataFrame(rows).set_index(["project", "sample"], drop=False)


SAMPLES = _build_sample_table()


def project_samples(project):
    """List sample IDs that belong to one project."""
    return SAMPLES.loc[project, "sample"].tolist() if project in SAMPLES.index.get_level_values(0) else []


def sample_layout(project, sample):
    return SAMPLES.loc[(project, sample), "layout"]


def sample_species(project, sample):
    return SAMPLES.loc[(project, sample), "species"]


def project_species(project):
    return PROJECTS.loc[project, "species"]


def species_row(species):
    return SPECIES.loc[species]


def hisat2_index_prefix(species):
    """Path prefix passed to hisat2 -x ..."""
    return os.path.join(SPECIES.loc[species, "index_dir"], "genome_tran")


def trimmed_fastq(project, sample):
    """Return the expected trimmed fastq path(s) for one sample."""
    base = f"{WORKDIR}/{project}/fastq_trimmed/{sample}"
    if sample_layout(project, sample) == "paired":
        return [f"{base}_1.fq.gz", f"{base}_2.fq.gz"]
    return [f"{base}.fq.gz"]


def get_all_targets():
    """Final targets that 'rule all' depends on."""
    targets = []
    for project in PROJECTS.index:
        targets.append(f"{WORKDIR}/{project}/counts/CountMatrix.csv")
        targets.append(f"{WORKDIR}/{project}/multiqc/multiqc_report.html")
        if config.get("run_eggnog", False):
            sp = project_species(project)
            targets.append(f"{WORKDIR}/annotation/{sp}/eggnog.emapper.annotations")
    return targets
