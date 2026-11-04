---
"@lattice-ui/react-tabs": patch
---

`Tabs.Content` names its default frame `TabsContent:<value>`, as it already did for `asChild` children and as `Tabs.Trigger` does on both paths. Before, only the `asChild` path got the name.
