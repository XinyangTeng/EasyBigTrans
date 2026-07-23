# Build HISAT2 transcriptome-aware index, once per species.

rule extract_splice_exon:
    input:
        gtf = lambda wc: species_row(wc.species)["genome_gtf"],
    output:
        ss   = f"{WORKDIR}/index_tmp/{{species}}/genome.ss",
        exon = f"{WORKDIR}/index_tmp/{{species}}/genome.exon",
    conda: "../envs/hisat2.yaml"
    log: f"{WORKDIR}/logs/index/{{species}}_extract.log"
    shell:
        """
        python workflow/scripts/parse_gff.py {input.gtf} \
            --splice-sites {output.ss} --exons {output.exon} 2> {log}
        """


rule hisat2_build:
    input:
        fa   = lambda wc: species_row(wc.species)["genome_fa"],
        ss   = f"{WORKDIR}/index_tmp/{{species}}/genome.ss",
        exon = f"{WORKDIR}/index_tmp/{{species}}/genome.exon",
    output:
        # HISAT2 writes 8 files; we touch a sentinel so Snakemake can track completion.
        done = f"{WORKDIR}/index_tmp/{{species}}/.index.done",
    params:
        prefix = lambda wc: hisat2_index_prefix(wc.species),
    threads: config["threads"]["hisat2_build"]
    conda: "../envs/hisat2.yaml"
    log: f"{WORKDIR}/logs/index/{{species}}_build.log"
    shell:
        """
        mkdir -p $(dirname {params.prefix})
        hisat2-build -p {threads} \
            --ss {input.ss} --exon {input.exon} \
            {input.fa} {params.prefix} &> {log}
        touch {output.done}
        """
