# Convert .sra to gzipped fastq using fasterq-dump.

rule fasterq_dump_paired:
    input:
        sra = lambda wc: SAMPLES.loc[(wc.project, wc.sample), "sra_path"],
    output:
        r1 = temp(f"{WORKDIR}/{{project}}/fastq_raw/{{sample}}_1.fastq.gz"),
        r2 = temp(f"{WORKDIR}/{{project}}/fastq_raw/{{sample}}_2.fastq.gz"),
    params:
        outdir = f"{WORKDIR}/{{project}}/fastq_raw",
    threads: config["threads"]["fasterq_dump"]
    conda: "../envs/sra-tools.yaml"
    log: f"{WORKDIR}/{{project}}/logs/fasterq_dump/{{sample}}.log"
    wildcard_constraints:
        sample = "|".join(SAMPLES.query("layout == 'paired'")["sample"].unique()) or "__none__",
    shell:
        """
        mkdir -p {params.outdir}
        fasterq-dump -e {threads} --split-3 -O {params.outdir} {input.sra} &> {log}
        gzip -f {params.outdir}/{wildcards.sample}_1.fastq {params.outdir}/{wildcards.sample}_2.fastq
        """


rule fasterq_dump_single:
    input:
        sra = lambda wc: SAMPLES.loc[(wc.project, wc.sample), "sra_path"],
    output:
        r = temp(f"{WORKDIR}/{{project}}/fastq_raw/{{sample}}.fastq.gz"),
    params:
        outdir = f"{WORKDIR}/{{project}}/fastq_raw",
    threads: config["threads"]["fasterq_dump"]
    conda: "../envs/sra-tools.yaml"
    log: f"{WORKDIR}/{{project}}/logs/fasterq_dump/{{sample}}.log"
    wildcard_constraints:
        sample = "|".join(SAMPLES.query("layout == 'single'")["sample"].unique()) or "__none__",
    shell:
        """
        mkdir -p {params.outdir}
        fasterq-dump -e {threads} -O {params.outdir} {input.sra} &> {log}
        gzip -f {params.outdir}/{wildcards.sample}.fastq
        """
