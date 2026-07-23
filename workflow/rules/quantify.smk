# featureCounts on all BAMs of one project, then convert to a tidy CSV.

def _project_bams(wildcards):
    return expand(
        f"{WORKDIR}/{wildcards.project}/bam/{{sample}}.sorted.bam",
        sample=project_samples(wildcards.project),
    )


def _featurecounts_flags(wildcards):
    """-p (paired) only if any sample in this project is paired-end."""
    layouts = SAMPLES.loc[wildcards.project, "layout"]
    is_paired = "paired" in set(layouts if hasattr(layouts, "__iter__") else [layouts])
    return "-p --countReadPairs" if is_paired else ""


rule featurecounts:
    input:
        bams = _project_bams,
        gtf  = lambda wc: species_row(project_species(wc.project))["genome_gtf"],
    output:
        counts  = f"{WORKDIR}/{{project}}/counts/counts.txt",
        summary = f"{WORKDIR}/{{project}}/counts/counts.txt.summary",
    params:
        flags = _featurecounts_flags,
    threads: config["threads"]["featurecounts"]
    conda: "../envs/subread.yaml"
    log: f"{WORKDIR}/{{project}}/logs/featurecounts.log"
    shell:
        """
        featureCounts -T {threads} -a {input.gtf} -g gene_id \
            {params.flags} -o {output.counts} {input.bams} &> {log}
        """


rule make_count_matrix:
    input:
        counts = f"{WORKDIR}/{{project}}/counts/counts.txt",
    output:
        matrix = f"{WORKDIR}/{{project}}/counts/CountMatrix.csv",
    shell:
        """
        python workflow/scripts/make_count_matrix.py {input.counts} {output.matrix}
        """
