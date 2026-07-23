# HISAT2 alignment piped directly to samtools sort. No intermediate SAM.

rule hisat2_align_paired:
    input:
        r1   = f"{WORKDIR}/{{project}}/fastq_trimmed/{{sample}}_1.fq.gz",
        r2   = f"{WORKDIR}/{{project}}/fastq_trimmed/{{sample}}_2.fq.gz",
        done = lambda wc: f"{WORKDIR}/index_tmp/{sample_species(wc.project, wc.sample)}/.index.done",
    output:
        bam = f"{WORKDIR}/{{project}}/bam/{{sample}}.sorted.bam",
        bai = f"{WORKDIR}/{{project}}/bam/{{sample}}.sorted.bam.bai",
    params:
        index = lambda wc: hisat2_index_prefix(sample_species(wc.project, wc.sample)),
    threads: config["threads"]["hisat2_align"]
    conda: "../envs/hisat2.yaml"
    log:
        align = f"{WORKDIR}/{{project}}/logs/hisat2/{{sample}}.log",
    wildcard_constraints:
        sample = "|".join(SAMPLES.query("layout == 'paired'")["sample"].unique()) or "__none__",
    shell:
        """
        hisat2 -p {threads} -x {params.index} \
            -1 {input.r1} -2 {input.r2} \
            --summary-file {log.align} \
            | samtools sort -@ {threads} -o {output.bam} -
        samtools index {output.bam}
        """


rule hisat2_align_single:
    input:
        r    = f"{WORKDIR}/{{project}}/fastq_trimmed/{{sample}}.fq.gz",
        done = lambda wc: f"{WORKDIR}/index_tmp/{sample_species(wc.project, wc.sample)}/.index.done",
    output:
        bam = f"{WORKDIR}/{{project}}/bam/{{sample}}.sorted.bam",
        bai = f"{WORKDIR}/{{project}}/bam/{{sample}}.sorted.bam.bai",
    params:
        index = lambda wc: hisat2_index_prefix(sample_species(wc.project, wc.sample)),
    threads: config["threads"]["hisat2_align"]
    conda: "../envs/hisat2.yaml"
    log:
        align = f"{WORKDIR}/{{project}}/logs/hisat2/{{sample}}.log",
    wildcard_constraints:
        sample = "|".join(SAMPLES.query("layout == 'single'")["sample"].unique()) or "__none__",
    shell:
        """
        hisat2 -p {threads} -x {params.index} -U {input.r} \
            --summary-file {log.align} \
            | samtools sort -@ {threads} -o {output.bam} -
        samtools index {output.bam}
        """
