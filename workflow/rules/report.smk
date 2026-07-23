# MultiQC: collect logs from fastp, HISAT2, featureCounts and render one HTML.

rule multiqc:
    input:
        # Force dependency on per-project outputs so MultiQC runs after them.
        counts = f"{WORKDIR}/{{project}}/counts/counts.txt.summary",
    output:
        report = f"{WORKDIR}/{{project}}/multiqc/multiqc_report.html",
    params:
        scan_dir = f"{WORKDIR}/{{project}}",
        out_dir  = f"{WORKDIR}/{{project}}/multiqc",
    conda: "../envs/multiqc.yaml"
    log: f"{WORKDIR}/{{project}}/logs/multiqc.log"
    shell:
        """
        multiqc {params.scan_dir} -o {params.out_dir} -n multiqc_report.html -f &> {log}
        """
