# Adapter trimming and quality filtering with fastp.

rule fastp_paired:
    input:
        r1 = f"{WORKDIR}/{{project}}/fastq_raw/{{sample}}_1.fastq.gz",
        r2 = f"{WORKDIR}/{{project}}/fastq_raw/{{sample}}_2.fastq.gz",
    output:
        r1   = f"{WORKDIR}/{{project}}/fastq_trimmed/{{sample}}_1.fq.gz",
        r2   = f"{WORKDIR}/{{project}}/fastq_trimmed/{{sample}}_2.fq.gz",
        html = f"{WORKDIR}/{{project}}/qc/fastp/{{sample}}.html",
        json = f"{WORKDIR}/{{project}}/qc/fastp/{{sample}}.json",
    params:
        extra = config["fastp_extra"],
    threads: config["threads"]["fastp"]
    conda: "../envs/fastp.yaml"
    log: f"{WORKDIR}/{{project}}/logs/fastp/{{sample}}.log"
    wildcard_constraints:
        sample = "|".join(SAMPLES.query("layout == 'paired'")["sample"].unique()) or "__none__",
    shell:
        """
        fastp -i {input.r1} -I {input.r2} \
              -o {output.r1} -O {output.r2} \
              -h {output.html} -j {output.json} \
              -w {threads} {params.extra} &> {log}
        """


rule fastp_single:
    input:
        r = f"{WORKDIR}/{{project}}/fastq_raw/{{sample}}.fastq.gz",
    output:
        r    = f"{WORKDIR}/{{project}}/fastq_trimmed/{{sample}}.fq.gz",
        html = f"{WORKDIR}/{{project}}/qc/fastp/{{sample}}.html",
        json = f"{WORKDIR}/{{project}}/qc/fastp/{{sample}}.json",
    params:
        extra = config["fastp_extra"],
    threads: config["threads"]["fastp"]
    conda: "../envs/fastp.yaml"
    log: f"{WORKDIR}/{{project}}/logs/fastp/{{sample}}.log"
    wildcard_constraints:
        sample = "|".join(SAMPLES.query("layout == 'single'")["sample"].unique()) or "__none__",
    shell:
        """
        fastp -i {input.r} -o {output.r} \
              -h {output.html} -j {output.json} \
              -w {threads} {params.extra} &> {log}
        """
