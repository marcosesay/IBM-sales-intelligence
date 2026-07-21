// IBM Data & AI product reference — injected into generation prompts so the
// model grounds recommendations in real product capabilities.
export const IBM_PRODUCTS = `
# IBM Data & AI Products

> Products are ordered by IBM's **data-first sales strategy**: data foundation → governance → AI & productivity → analytics & automation.
> Every AI use case should be anchored in a solid data and governance layer first.

---

## Priority 1 — Data Foundation

### watsonx.data

**Open, hybrid data lakehouse — one copy of data, any query engine.**

**How it works:**
- Stores data in open formats (Parquet, Iceberg) on any cloud or on-prem object storage — no proprietary lock-in.
- A shared metadata catalog lets Presto, Spark, Db2, and Netezza all query the same tables without copying data.
- Offloads cold data from expensive warehouses to cheap object storage, cutting warehouse cost by up to 50%.
- Built-in data access controls and audit logs satisfy governance requirements before AI is introduced.


S3 / Object Store (Parquet/Iceberg)
        ↕  shared metadata catalog
  Presto (ad-hoc)  ·  Spark (pipelines)  ·  Db2/Netezza (OLAP)


---

### DataStage (watsonx.data Integration)

**High-performance ETL/ELT that moves and transforms data at enterprise scale.**

**How it works:**
- Visual pipeline designer to build extract → transform → load flows without writing low-level code.
- Runs natively on Kubernetes — pipelines scale horizontally across nodes as data volume grows.
- Connectors to 100+ sources: relational databases, SaaS apps, mainframes, Kafka streams, REST APIs.
- Pushdown optimization sends transformation logic into the source engine to avoid moving raw data.

---

### Db2

**Relational database with in-database ML — OLTP and OLAP in one engine.**

**How it works:**
- ACID-compliant engine handles both transactional workloads (OLTP) and analytical queries (OLAP) without separate systems.
- Db2 AI Advanced Edition embeds an ML runtime: train and score models in pure SQL, no data export needed.
- BLU Acceleration: columnar in-memory processing for analytics — no indexes or aggregation tables required.
- Runs on-prem, IBM Cloud, AWS, Azure, or inside Red Hat OpenShift.

---

### Netezza

**MPP analytical data warehouse — built for petabyte-scale analytics.**

**How it works:**
- Data is distributed across many nodes; every query runs in parallel across all of them simultaneously.
- Zone maps and column-level compression eliminate unnecessary I/O before data reaches the CPU.
- On-prem variant uses FPGA-based hardware acceleration; cloud variant (Netezza Performance Server) runs on IBM Cloud or AWS.
- Deep integration with watsonx.data — Netezza acts as a high-performance query engine over open Iceberg tables.

---

### IBM Data Replication

**Near-real-time change data capture (CDC) — zero-impact continuous sync.**

**How it works:**
- Reads the database transaction log — not the tables — so zero performance impact on the source system.
- Captures every INSERT, UPDATE, and DELETE and streams changes to targets within milliseconds.
- Targets include: other databases, Kafka topics, data lakes, cloud warehouses, or IBM Event Streams.
- Used for operational analytics, active-active disaster recovery, and feeding real-time AI feature stores.

---

## Priority 2 — Governance & Trust

### IBM Guardium

**Data security, audit, and compliance — every query inspected, every access logged.**

**How it works:**
- Lightweight kernel-level agents (S-TAPs) sit on database servers and inspect every SQL query — nothing bypasses them.
- Behavioral analytics baselines normal access patterns; anomalies (e.g. bulk SSN exports) trigger real-time alerts or blocks.
- **Guardium Data Protection**: monitors and audits structured database activity across Db2, Oracle, SQL Server, and more.
- **Guardium Insights**: SaaS dashboard aggregating audit trails from all collectors for compliance reporting (SOC 2, PCI, HIPAA).
- **Guardium for AI**: scans AI models and pipelines for sensitive data exposure — aligned with EU AI Act requirements.

---

### watsonx.governance

**AI lifecycle governance — track, monitor, and prove every model is fair and compliant.**

**How it works:**
- Connects to any model (IBM, open-source, or third-party) via an **AI Factsheet** that records lineage, training data, and deployment history.
- Automated monitors run continuously in production: data drift detection, fairness scoring, quality metrics, and explainability reports.
- Risk cards map each model to regulatory frameworks (EU AI Act, SR 11-7, GDPR) and auto-generate compliance evidence packages.
- Works across watsonx.ai models and external models on SageMaker, Azure ML, or any REST endpoint.


Model (anywhere)
  → AI Factsheet (lineage + metadata)
  → Continuous monitors (drift · bias · quality)
  → Risk dashboard + compliance reports


---

## Priority 3 — AI & Productivity

### watsonx.ai

**Enterprise AI studio — build, tune, deploy, and manage foundation models.**

**How it works:**
- Hosts IBM **Granite** models (language, code, time-series, geospatial) plus curated open-source models (Llama, Mixtral).
- **Prompt Lab**: interactive UI to test and refine prompts against any hosted model without writing code.
- **Tuning Studio**: fine-tune models on your own data using prompt tuning or full fine-tuning, without managing GPU infrastructure.
- **Inference API**: REST endpoint to call any model from your application — deployed inside your IBM Cloud project so data stays in your tenant.

---

### watsonx Orchestrate

**AI automation agent — understands natural language and orchestrates work across enterprise apps.**

**How it works:**
- A conversational AI agent that decomposes natural language instructions into multi-step workflows automatically.
- Connects to Salesforce, SAP, ServiceNow, Workday, and more via pre-built **skills** — each skill is one callable action.
- An orchestration layer chains skills: "send renewal notices to all expiring accounts" triggers CRM lookup → doc generation → email, with no code.
- Built on watsonx.ai foundation models for natural language understanding, with full audit trail of every action taken.

---

### watsonx Code Assistant

**AI developer copilot — generates, explains, and modernizes code for enterprise platforms.**

**How it works:**
- Embeds in VS Code and Eclipse; variants target specific enterprise needs rather than general-purpose coding.
- **For Red Hat Ansible**: generates Ansible playbooks from plain-language task descriptions.
- **For Z (COBOL)**: explains legacy COBOL logic, refactors it, and generates Java equivalents for modernization.
- **For Application Modernization**: analyzes Java EE apps and produces migration plans + code patches targeting Liberty.
- Powered by IBM **Granite** code models trained exclusively on auditable, permissively licensed code — safe for enterprise IP.

---

## Priority 4 — Analytics & Automation

### IBM Cognos Analytics

**Self-service BI — from raw data to interactive dashboards with AI-assisted authoring.**

**How it works:**
- Connects to any source: Db2, Netezza, watsonx.data, cloud warehouses, flat files, or streaming data.
- AI-assisted authoring: type a natural language question and Cognos generates the right chart automatically.
- Report authors build pixel-perfect formatted reports; business users explore with interactive drag-and-drop dashboards.
- **Cognos Analytics with Watson**: anomaly detection and NLG automatically narrates what changed in the data each period.

---

### IBM Planning Analytics (TM1)

**In-memory OLAP planning engine — budgeting, forecasting, and what-if scenarios at speed.**

**How it works:**
- TM1 engine stores multidimensional cubes in RAM for instant slice-and-dice across time × product × region × scenario.
- Business users build rolling forecasts, budgets, and scenario models in Excel or a web UI — writeback goes directly to the cube.
- Auto-generates planning templates and consolidations based on your org hierarchy.
- Primarily used in FP&A (financial planning & analysis) and supply chain planning teams.

---

### IBM SPSS

**Statistical analysis and predictive modeling — from descriptive stats to deployable ML models.**

**How it works:**
- **SPSS Statistics**: classic statistical workbench — regression, ANOVA, survival analysis — via point-and-click UI or syntax scripting.
- **SPSS Modeler**: visual drag-and-drop ML pipeline builder using the CRISP-DM methodology, no coding required.
- Outputs scored models deployable as REST APIs or exported to PMML for use in other systems.
- Widely used in academic research, social sciences, healthcare outcomes, and financial risk modeling.

---

### IBM Decision Optimization

**Prescriptive analytics — determines the mathematically optimal action given constraints.**

**How it works:**
- Uses mathematical programming (linear, integer, constraint) to solve "what is the best decision?" problems.
- Powered by **CPLEX** — one of the world's leading commercial optimization solvers.
- Common use cases: supply chain routing, crew scheduling, financial portfolio optimization, production planning.
- Integrates with watsonx.ai so ML predictions (what will happen) feed directly into optimization decisions (what to do).

---

### IBM FileNet

**Enterprise content management — stores, manages, and automates unstructured content at scale.**

**How it works:**
- **Content Engine**: petabyte-scale repository with versioning, legal holds, and retention policies for documents, images, and video.
- **Process Engine**: workflow automation that routes documents through approval chains based on configurable business rules.
- Integrates with watsonx.ai for intelligent document processing — OCR and NLP classify and extract data from scanned documents.
- Critical in regulated industries (banking, insurance, government) for audit trails and records management compliance.

---

## Summary


DATA-FIRST PRIORITY ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIORITY 1 — DATA FOUNDATION
  watsonx.data        open lakehouse, multi-engine query
  DataStage           ETL/ELT pipelines, 100+ connectors
  Db2                 relational DB + in-database ML
  Netezza             MPP analytics warehouse
  Data Replication    CDC, real-time sync, zero source impact

PRIORITY 2 — GOVERNANCE & TRUST
  Guardium            data security, audit, compliance
  watsonx.governance  AI lifecycle, risk cards, fairness

PRIORITY 3 — AI & PRODUCTIVITY
  watsonx.ai          foundation models, studio, inference API
  watsonx Orchestrate AI agent, skill orchestration across apps
  watsonx Code Asst   developer copilot — COBOL, Ansible, Java

PRIORITY 4 — ANALYTICS & AUTOMATION
  Cognos Analytics    BI, dashboards, NL-assisted authoring
  Planning Analytics  in-memory OLAP, FP&A, budgeting
  SPSS                statistics, predictive modeling, CRISP-DM
  Decision Optim.     prescriptive analytics, CPLEX solver
  FileNet             ECM, document workflows, records mgmt


> **15 products total** across 4 priority tiers.

`;