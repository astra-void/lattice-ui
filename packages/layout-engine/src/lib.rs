use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct UDim {
    pub scale: f32,
    pub offset: f32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct UDim2 {
    pub x: UDim,
    pub y: UDim,
}

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct Vector2 {
    pub x: f32,
    pub y: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RobloxNode {
    #[serde(alias = "Id")]
    pub id: String,
    #[serde(alias = "nodeType", alias = "NodeType")]
    pub node_type: String,
    #[serde(alias = "Size")]
    pub size: UDim2,
    #[serde(alias = "Position")]
    pub position: UDim2,
    #[serde(alias = "anchorPoint", alias = "AnchorPoint")]
    pub anchor_point: Vector2,
    #[serde(default, alias = "Children")]
    pub children: Vec<RobloxNode>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct ComputedRect {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

#[inline]
fn resolve_udim(udim: UDim, parent_axis_size: f32) -> f32 {
    (parent_axis_size * udim.scale) + udim.offset
}

/// Formula:
/// - `AbsoluteSize = (ParentSize * Scale) + Offset`
/// - `AbsolutePosition = ParentPosition + (ParentSize * PositionScale) + PositionOffset - (AnchorPoint * AbsoluteSize)`
fn compute_node_rect(node: &RobloxNode, parent_rect: &ComputedRect) -> ComputedRect {
    let width = resolve_udim(node.size.x, parent_rect.width);
    let height = resolve_udim(node.size.y, parent_rect.height);

    let x = parent_rect.x + resolve_udim(node.position.x, parent_rect.width)
        - (node.anchor_point.x * width);
    let y = parent_rect.y + resolve_udim(node.position.y, parent_rect.height)
        - (node.anchor_point.y * height);

    ComputedRect {
        x,
        y,
        width,
        height,
    }
}

fn solve_layout_recursive(
    node: &RobloxNode,
    parent_rect: &ComputedRect,
    output: &mut HashMap<String, ComputedRect>,
) {
    let computed_rect = compute_node_rect(node, parent_rect);
    output.insert(node.id.clone(), computed_rect);

    for child in &node.children {
        solve_layout_recursive(child, &computed_rect, output);
    }
}

#[wasm_bindgen]
pub fn compute_layout(
    raw_tree: JsValue,
    viewport_width: f32,
    viewport_height: f32,
) -> Result<JsValue, JsValue> {
    let root: RobloxNode = serde_wasm_bindgen::from_value(raw_tree)
        .map_err(|error| JsValue::from_str(&format!("Failed to parse raw_tree: {error}")))?;

    let viewport_rect = ComputedRect {
        x: 0.0,
        y: 0.0,
        width: viewport_width,
        height: viewport_height,
    };

    let mut computed = HashMap::new();
    solve_layout_recursive(&root, &viewport_rect, &mut computed);

    serde_wasm_bindgen::to_value(&computed).map_err(|error| {
        JsValue::from_str(&format!("Failed to serialize computed layout: {error}"))
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn assert_close(actual: f32, expected: f32) {
        let delta = (actual - expected).abs();
        assert!(delta < 0.0001, "expected {expected}, got {actual}");
    }

    fn udim(scale: f32, offset: f32) -> UDim {
        UDim { scale, offset }
    }

    #[test]
    fn computes_anchor_adjusted_rect() {
        let root = RobloxNode {
            id: "root".to_string(),
            node_type: "Frame".to_string(),
            size: UDim2 {
                x: udim(0.5, 0.0),
                y: udim(0.5, 0.0),
            },
            position: UDim2 {
                x: udim(0.5, 0.0),
                y: udim(0.5, 0.0),
            },
            anchor_point: Vector2 { x: 0.5, y: 0.5 },
            children: vec![],
        };

        let viewport_rect = ComputedRect {
            x: 0.0,
            y: 0.0,
            width: 1000.0,
            height: 800.0,
        };

        let mut output = HashMap::new();
        solve_layout_recursive(&root, &viewport_rect, &mut output);

        let rect = output.get("root").expect("root should be computed");
        assert_close(rect.x, 250.0);
        assert_close(rect.y, 200.0);
        assert_close(rect.width, 500.0);
        assert_close(rect.height, 400.0);
    }

    #[test]
    fn computes_nested_layout_in_one_pass() {
        let child = RobloxNode {
            id: "child".to_string(),
            node_type: "Frame".to_string(),
            size: UDim2 {
                x: udim(0.5, 10.0),
                y: udim(1.0, -20.0),
            },
            position: UDim2 {
                x: udim(1.0, 0.0),
                y: udim(0.0, 30.0),
            },
            anchor_point: Vector2 { x: 1.0, y: 0.0 },
            children: vec![],
        };

        let root = RobloxNode {
            id: "root".to_string(),
            node_type: "Frame".to_string(),
            size: UDim2 {
                x: udim(0.5, 100.0),
                y: udim(0.25, 50.0),
            },
            position: UDim2 {
                x: udim(0.1, 20.0),
                y: udim(0.2, 10.0),
            },
            anchor_point: Vector2 { x: 0.25, y: 0.5 },
            children: vec![child],
        };

        let viewport_rect = ComputedRect {
            x: 0.0,
            y: 0.0,
            width: 1000.0,
            height: 1000.0,
        };

        let mut output = HashMap::new();
        solve_layout_recursive(&root, &viewport_rect, &mut output);

        let root_rect = output.get("root").expect("root should be computed");
        assert_close(root_rect.x, -30.0);
        assert_close(root_rect.y, 60.0);
        assert_close(root_rect.width, 600.0);
        assert_close(root_rect.height, 300.0);

        let child_rect = output.get("child").expect("child should be computed");
        assert_close(child_rect.x, 260.0);
        assert_close(child_rect.y, 90.0);
        assert_close(child_rect.width, 310.0);
        assert_close(child_rect.height, 280.0);
    }
}
