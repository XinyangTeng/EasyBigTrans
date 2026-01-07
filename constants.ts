export const DEFAULT_CONFIG = {
  projectBase: "/project/big.RNA.pro1",
  genomeBase: "/project/big.RNA.pro1/genome_index",
  threads: 20,
  speciesList: ["Solanum_virginianum", "Glycine_max", "Arabidopsis_thaliana"],
  projects: [
    { name: "PRJNA327257", species: "Solanum_lycopersicum" },
    { name: "PRJNA495025", species: "Solanum_virginianum" }
  ]
};

export const SCRIPTS = {
  unzip: `#!/bin/bash
# 1. 批量解压 SRA 文件 (batch_unzip_sra.sh)
# 在包含所有项目文件夹的父目录中运行

for dir in */; do 
  if [ -d "\${dir}SRA" ]; then 
    echo "正在处理项目: \${dir}"
    mkdir -p "\${dir}raw_data" && \\
    cd "\${dir}SRA"
    
    # 使用 fasterq-dump (推荐，速度更快)
    for sra_file in *.sra; do
      if [ -f "$sra_file" ]; then
        echo "正在解压: $sra_file"
        fasterq-dump -p -e {{THREADS}} --split-3 -O "../raw_data" "$sra_file"
        # 压缩为 gz 格式以节省空间
        gzip "../raw_data/"*.fastq
      fi
    done
    
    # 备选方案: 使用 fastq-dump
    # ls *.sra 2>/dev/null | xargs -I {} fastq-dump --split-3 -O "../raw_data" --gzip {}
    
    cd ../..
  fi; 
done`,

  index: `#!/bin/bash
# 2. 批量构建基因组索引 (batch_build_index.sh)

CSV_FILE="species.csv"
GENOME_BASE="{{GENOME_BASE}}"

while IFS=, read -r species_name; do
  if [[ "$species_name" == "species_name" ]]; then continue; fi

  genome_dir="$GENOME_BASE/$species_name"
  mkdir -p "$genome_dir"
  
  # 查找基因组文件
  genome_fa=$(find "$genome_dir" -type f \( -name "*.fna" -o -name "*.fa" -o -name "*.fasta" \) -print -quit)
  genome_gtf=$(find "$genome_dir" -type f \( -name "*.gtf" -o -name "*.gff" \) -print -quit)
  
  if [[ -f "$genome_fa" && -f "$genome_gtf" ]]; then
    echo "正在为 $species_name 构建索引..."
    
    # 提取外显子和剪切位点
    cd "$genome_dir"
    gunzip -f *.gz 2>/dev/null
    
    python /path/to/hisat2-2.1.0/extract_exons.py "$genome_gtf" > genome.exon
    python /path/to/hisat2-2.1.0/extract_splice_sites.py "$genome_gtf" > genome.ss
    
    # 构建 HISAT2 索引
    hisat2-build -p {{THREADS}} --ss genome.ss --exon genome.exon "$genome_fa" genome_tran
    
    echo "$species_name 索引构建完成"
  else
    echo "警告: $species_name 缺少基因组文件"
  fi
done < "$CSV_FILE"`,

  align: `#!/bin/bash
# 3. 批量比对分析 (batch_align.sh)

CSV_FILE="project_species.csv"
PROJECT_BASE="{{PROJECT_BASE}}/RNA.seq.pro"
GENOME_BASE="{{GENOME_BASE}}"

while IFS=, read -r project_name species_name; do
  if [[ "$project_name" == "project_name" ]]; then continue; fi

  project_dir="$PROJECT_BASE/$project_name"
  genome_dir="$GENOME_BASE/$species_name"
  
  if [[ ! -d "$project_dir" ]]; then
    echo "项目目录不存在: $project_dir"
    continue
  fi
  
  echo "正在处理: $project_name, 物种: $species_name"
  
  # 创建输出目录
  mkdir -p "$project_dir/sam"
  mkdir -p "$project_dir/bam"
  mkdir -p "$project_dir/counts"
  
  cd "$project_dir/raw_data"
  
  # 检测双端/单端测序
  paired_files=()
  single_files=()
  
  for fastq in *.fastq.gz; do
    if [[ "$fastq" =~ "_1.fastq.gz" ]]; then
      sample=$(echo "$fastq" | sed 's/_1.fastq.gz//')
      if [[ -f "\${sample}_2.fastq.gz" ]]; then paired_files+=("$sample"); fi
    elif [[ ! "$fastq" =~ "_2.fastq.gz" ]]; then
      sample=$(echo "$fastq" | sed 's/.fastq.gz//')
      single_files+=("$sample")
    fi
  done
  
  # 双端比对
  for sample in "\${paired_files[@]}"; do
    echo "比对双端样本: $sample"
    hisat2 -p {{THREADS}} \\
      -x "$genome_dir/genome_tran" \\
      -1 "\${sample}_1.fastq.gz" \\
      -2 "\${sample}_2.fastq.gz" \\
      -S "../sam/\${sample}.sam" 2> "../sam/\${sample}.log"
  done
  
  # 单端比对
  for sample in "\${single_files[@]}"; do
    echo "比对单端样本: $sample"
    hisat2 -p {{THREADS}} \\
      -x "$genome_dir/genome_tran" \\
      -U "\${sample}.fastq.gz" \\
      -S "../sam/\${sample}.sam" 2> "../sam/\${sample}.log"
  done
  
  # SAM 转 BAM 并排序
  cd "$project_dir/sam"
  for sam_file in *.sam; do
    sample=$(basename "$sam_file" .sam)
    echo "格式转换: $sam_file -> $sample.bam"
    samtools view -b -S "$sam_file" > "../bam/$sample.bam"
    samtools sort -@ {{THREADS}} -o "../bam/\${sample}_sorted.bam" "../bam/$sample.bam"
    samtools index "../bam/\${sample}_sorted.bam"
  done
  
  # 表达量定量 (FeatureCounts)
  cd "$project_dir/bam"
  genome_gtf=$(find "$genome_dir" -type f \( -name "*.gtf" -o -name "*.gff" \) -print -quit)
  
  if [[ -f "$genome_gtf" ]]; then
    echo "正在计算表达量..."
    featureCounts -a "$genome_gtf" \\
      -g gene_id \\
      -o "../counts/counts.txt" \\
      -p *.bam
    
    # 转换为 CSV 格式
    cd "$project_dir/counts"
    awk 'BEGIN {FS="\t"; OFS=","} !/^#/ {
        printf "%s", $1;
        for (i=7; i<=NF; i++) {
            printf "%s%s", OFS, $i;
        }
        print "";
    }' counts.txt > CountMatrix.csv
    
    echo "$project_name 分析完成"
  else
    echo "错误: 未找到 GTF 文件"
  fi
  
done < "$CSV_FILE"`,

  main: `#!/bin/bash
# 4. 主控脚本 (main_pipeline.sh)

echo "=== RNA-seq 批量分析流程开始 ==="
echo "时间: $(date)"

# 步骤 1: 批量解压 SRA
echo "步骤 1: 解压 SRA 文件..."
./batch_unzip_sra.sh

# 步骤 2: 构建索引
echo "步骤 2: 构建基因组索引..."
./batch_build_index.sh

# 步骤 3: 比对与定量
echo "步骤 3: 比对分析和表达量计算..."
./batch_align.sh

# 步骤 4: 结果汇总
echo "步骤 4: 汇总分析结果..."
echo "正在生成报告..."

echo "Project,Species,SampleCount,AlignmentRate,FinishTime" > analysis_summary.csv

for project_dir in {{PROJECT_BASE}}/RNA.seq.pro/*/; do
  project=$(basename "$project_dir")
  # 简单的完成检查
  if [[ -f "$project_dir/counts/CountMatrix.csv" ]]; then
    sample_count=$(ls "$project_dir/raw_data/"*.fastq.gz 2>/dev/null | wc -l)
    alignment_rate=$(grep "overall alignment rate" "$project_dir/sam"/*.log 2>/dev/null | tail -1 | awk '{print $1}' || echo "N/A")
    echo "$project,$species,$sample_count,$alignment_rate,$(date)" >> analysis_summary.csv
  fi
done

echo "=== 所有分析已完成 ==="
echo "时间: $(date)"`,

  download: `#!/bin/bash
# 5.1 下载基因组数据 (download_genome.sh)
# 用法: ./download_genome.sh Arabidopsis_thaliana

species=$1
output_dir="{{GENOME_BASE}}/$species"
mkdir -p "$output_dir"

# Ensembl Plants 下载基础 URL
ensembl_base="ftp://ftp.ensemblgenomes.org/pub/plants/release-60"

echo "正在下载 $species 到 $output_dir..."

case $species in
  "Arabidopsis_thaliana")
    wget -P "$output_dir" "$ensembl_base/fasta/arabidopsis_thaliana/dna/Arabidopsis_thaliana.TAIR10.dna.toplevel.fa.gz"
    wget -P "$output_dir" "$ensembl_base/gtf/arabidopsis_thaliana/Arabidopsis_thaliana.TAIR10.60.gtf.gz"
    ;;
  # 在此处添加其他物种...
  *)
    echo "物种 $species 尚未配置下载路径，请手动下载。"
    ;;
esac`,

  no_kegg: `#!/bin/bash
# 5.2 无 KEGG 物种注释 (annotate_no_kegg.sh)

species_dir=$1
cd "$species_dir"

# 提取 CDS 序列
gffread -T -o cds.gtf *.gtf
bedtools getfasta -fi *.fa -bed cds.gtf -fo cds_sequences.fa -name

# 翻译为蛋白序列
transeq -sequence cds_sequences.fa -outseq protein_sequences.faa -trim Y

# eggNOG 注释
emapper.py -i protein_sequences.faa \\
  -o emapper_output \\
  -m diamond \\
  --cpu {{THREADS}} \\
  --data_dir /biostack/database/emapperdb/`
};

export const GUIDE_CONTENT = `
# RNA-seq 批量分析实施方案

## 1. 目录结构
\`\`\`text
{{PROJECT_BASE}}/
├── RNA.seq.pro/              # 所有项目目录
│   ├── PRJNA327257/          # 项目 1
│   │   ├── SRA/              # 原始 SRA 文件
│   │   ├── raw_data/         # 解压后的 fastq 文件
│   │   ├── sam/              # 比对结果 sam
│   │   ├── bam/              # 二进制文件 bam
│   │   └── counts/           # 表达量结果
│   └── ...
└── genome_index/             # 基因组索引
    ├── Solanum_virginianum/
    ├── Glycine_max/
    └── ...
\`\`\`

## 2. 配置文件
**project_species.csv** (项目-物种对应表)
\`\`\`csv
project_name,species_name
PRJNA327257,Solanum_lycopersicum
PRJNA495025,Solanum_virginianum
\`\`\`

**species.csv** (物种列表)
\`\`\`csv
species_name
Solanum_virginianum
Glycine_max
Arabidopsis_thaliana
\`\`\`

## 3. 执行流程
1. **准备目录**:
   \`mkdir -p {{PROJECT_BASE}}/{RNA.seq.pro,genome_index,scripts}\`
2. **部署脚本**:
   下载生成的脚本并放入 \`scripts\` 目录。
   \`chmod +x *.sh\`
3. **运行流程**:
   \`./main_pipeline.sh 2>&1 | tee pipeline.log\`

## 4. 系统要求
- CPU: 建议 {{THREADS}} 核心
- 内存: 64GB+
- 软件依赖: hisat2, samtools, subread (featureCounts), sra-tools (fasterq-dump)
`;

export const README_TEMPLATE = `# RNA-seq 批量分析流程

## 项目概览
本仓库包含用于处理多个 RNA-seq 项目的自动化流程。
**基础路径:** \`{{PROJECT_BASE}}\`
**基因组路径:** \`{{GENOME_BASE}}\`
**配置线程数:** {{THREADS}}

## 已配置项目
{{PROJECT_LIST}}

## 目标物种
{{SPECIES_LIST}}

## 流程步骤
1. **数据准备**: 使用 \`fasterq-dump\` 将 SRA 文件解压为 FastQ 格式。
2. **建立索引**: 为所有目标物种构建 HISAT2 索引。
3. **比对分析**: 使用 HISAT2 将 reads 比对到参考基因组。
4. **定量分析**: 使用 FeatureCounts 计算基因表达量。
5. **结果汇总**: 将结果汇总至 \`analysis_summary.csv\`。

## 使用方法
1. 将脚本放置于 \`{{PROJECT_BASE}}/scripts/\` 目录中。
2. 确保 \`project_species.csv\` 和 \`species.csv\` 配置文件存在。
3. 运行主控脚本:
   \`\`\`bash
   ./main_pipeline.sh
   \`\`\`

## 依赖要求
- **hisat2** (v2.1.0+)
- **samtools** (v1.9+)
- **subread** (featureCounts)
- **sra-tools** (fasterq-dump)
- **python** (用于索引提取脚本)
`;