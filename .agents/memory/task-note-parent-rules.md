---
name: Task and note parent rules
description: The distinct parent requirements for tasks and notes under amendment A7.
---

Tasks may be linked to a customer, linked to a project, or be internal with neither parent. A task may never hold both parents. Notes must continue to hold exactly one parent, customer or project.

**Why:** Amendment A7 preserves the Internal context case in the Team To-Do workspace while preventing ambiguous task ownership. Notes require a concrete timeline parent.

**How to apply:** Keep task creation validation at "at most one parent" and never restore a task database constraint requiring exactly one. Preserve the notes exact-parent constraint whenever schema migrations change parent relationships.