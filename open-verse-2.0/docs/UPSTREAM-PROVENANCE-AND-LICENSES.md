# Upstream Provenance and Licensing Specification

## 1. Provenance Identification

OPEN-VERSE 2.0 adopts the complete codebase and technical architecture of the open-source Hermes Agent project.

- **Upstream Project:** Hermes Agent
- **Originating Organization:** Nous Research and Open Source Community Contributors
- **Upstream Repository Reference:** `https://github.com/NousResearch/hermes-agent`
- **Tracked Upstream Commit SHA:** `69d126be`
- **Release Version Identifier:** `v0.21.5+8825.g69d126b`
- **Local Reference Source Archive:** Preserved intact within `sources/hermes-agent/`

---

## 2. Licensing Model & Terms

### 2.1 Upstream License
The upstream Hermes Agent project is released under the **MIT License**.
Under the terms of the MIT License, permissions are granted for:
- Commercial and non-commercial use
- Modification and adaptation
- Distribution and redistribution
- Private and public deployment
- Sublicensing

The primary obligation of the MIT License is to retain the original copyright notice and permission notice in copies or substantial portions of the software.

### 2.2 Attribution Notice
```text
Copyright (c) Nous Research and Hermes Agent contributors.
```

The original LICENSE file is preserved directly within:
`sources/hermes-agent/LICENSE` and `open-verse-2.0/LICENSE`.

---

## 3. Preservation of Upstream Attribution in OPEN-VERSE 2.0

To ensure strict compliance with legal attribution obligations and respect for upstream authors:

1. **Unmodified Internal Architecture:**
   Internal packages and modules (`hermes_cli`, `agent`, `gateway`, `tools`) retain their upstream structure and technical references to ensure complete compatibility with upstream patches.

2. **User-Facing Product Identity:**
   User-facing banners and application labels denote the product as **OPEN-VERSE 2.0**, while explicitly acknowledging the underlying engine:
   `OPEN-VERSE 2.0 (based on Hermes Agent by Nous Research)`.

3. **Documentation Pointers:**
   All documentation within OPEN-VERSE 2.0 links directly to this provenance declaration.

---

## 4. Key Third-Party Dependencies

OPEN-VERSE 2.0 leverages standard, open-source libraries across Python and TypeScript ecosystems, each governed by permissive open-source licenses:

- **FastAPI / Starlette:** MIT License (REST and WebSocket gateway framework)
- **OpenAI Python SDK:** Apache 2.0 License (Universal model interaction layer)
- **Prompt Toolkit & Rich:** BSD 3-Clause License / MIT License (Interactive TUI and terminal rendering)
- **Pydantic:** MIT License (Data validation and tool parameter schemas)
- **Playwright:** Apache 2.0 License (Headless browser automation)
- **Electron & React:** MIT License (Desktop HUD application)
- **SQLite:** Public Domain (High-performance transactional state persistence)
- **Portalocker:** PSF / Apache 2.0 License (Cross-platform file locking for atomic updates)
