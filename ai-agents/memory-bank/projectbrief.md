# Project Brief

## Overview
Liam Migration is a new solution designed to significantly reduce the risks and rework costs associated with complex DB schema changes through AI support and automated reviews. It enables development teams to safely and quickly manage release cycles. Beyond OSS-based ER diagram visualization, it offers migration diff checks and intelligent optimization suggestions at the Pull Request stage, achieving a balance between design quality and development speed.

## Core Requirements and Goals
- Reduce risks and rework costs in DB schema changes using AI support and automated reviews.
- Enable safe and fast release cycles for development teams.
- Provide migration diff checks and intelligent optimization suggestions at the Pull Request stage.
- Achieve a balance between design quality and development speed.

## Ubiquitous Language
- **Liam Migration**: The product name. Reduces risks and rework costs associated with DB schema changes through AI support and automated reviews, enabling safe and fast development cycles.
- **Project**: A management unit for database schemas, continuously updated through migrations, accumulating schema change history and design knowledge.
- **Liam ERD**: An OSS-based tool for automatic generation and visualization of ER diagrams, developed before Liam Migration.
- **Migration**: A series of operations to change the database schema (structure), including creating, modifying, and deleting tables and columns, transitioning the database to a new structure. In this product, it refers only to schema changes, not database or data migrations.
- **Review Agent**: An AI component that automatically analyzes the impact range of migrations, predicting risks, performance, and data integrity impacts, improving review accuracy through continuous learning.
- **Reviewer User**: A human role in the product. Validates and approves changes based on AI feedback and automatic analysis results, ensuring design safety and quality.
- **Builder User**: A human role in the product. Responsible for executing DB schema changes (code generation and migration application). Initially focused on Reviewer, with phased implementation planned.
- **Migration Review Page**: A dedicated interface for centrally reviewing detailed migration changes, cautions, and AI suggestions, allowing users to understand review status and improvement points.
- **GitHub App**: A mechanism for automating and streamlining comments and review approvals on PRs through integration with GitHub repositories, supporting seamless development flow.

## Background
### Current Situation
- Liam ERD has alleviated the pain of update costs and schema understanding at a level comparable to other similar tools, including OSS, through automatic generation and visualization of ER diagrams.
- It has received high praise for "UI/UX refinement," "support for large tables," "CI/CD integration," and "automatic document updates."

### Challenges
- The proliferation of the free OSS version leads to "star acquisition and user community expansion" but lacks a clearly established monetization model.
- Documentation and visualization alone make it difficult to differentiate from competing tools, making it challenging for companies to have a strong reason to adopt the paid version.

### Future Direction
- To answer the fundamental question of "Why ERD now?" and "Why is it worth paying for?" it is necessary to propose greater value.
- Automating and enhancing tasks that are burdensome for developers, in addition to alleviating pain, will be key to creating new gains (dramatic improvements in productivity and design quality).
- The phase of DB schema changes (migrations) is a challenging area with high rework costs and a tendency to become personalized, and it is not sufficiently solved by existing competing tools.
- Therefore, high-value-added features such as AI-based schema reviews and diff analysis will be provided mainly in paid plans, aiming for a sustainable business model while coexisting with OSS.
