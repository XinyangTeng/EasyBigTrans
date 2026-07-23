# Optional functional annotation with eggNOG-mapper.
# Triggered only when run_eggnog=true in config. Runs once per species.

rule extract_proteins:
    input:
        fa  = lambda wc: species_row(wc.species)["genome_fa"],
        gtf = lambda wc: species_row(wc.species)["genome_gtf"],
    output:
        faa = f"{WORKDIR}/annotation/{{species}}/proteins.faa",
    conda: "../envs/eggnog.yaml"
    log: f"{WORKDIR}/logs/annotate/{{species}}_extract.log"
    shell:
        """
        gffread -y {output.faa} -g {input.fa} {input.gtf} &> {log}
        """


rule eggnog_mapper:
    input:
        faa = f"{WORKDIR}/annotation/{{species}}/proteins.faa",
    output:
        ann = f"{WORKDIR}/annotation/{{species}}/eggnog.emapper.annotations",
    params:
        outdir = f"{WORKDIR}/annotation/{{species}}",
        db     = config["eggnog_db"],
    threads: config["threads"]["eggnog"]
    conda: "../envs/eggnog.yaml"
    log: f"{WORKDIR}/logs/annotate/{{species}}_eggnog.log"
    shell:
        """
        emapper.py -i {input.faa} -o eggnog \
            --output_dir {params.outdir} \
            --data_dir {params.db} \
            -m diamond --cpu {threads} --override &> {log}
        """
