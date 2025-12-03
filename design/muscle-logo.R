# simple line splines -----------
library(ggplot2)
library(grid) # For custom text positioning if needed

# 1. Define the Anchor Points (The "Control Points")
# I've tightened the coordinates to make the arm look punchy and strong
anchors <- data.frame(
  part = c(rep("Top", 5), rep("Bottom", 5)),
  x = c(
    # Top Line (Shoulder to Wrist)
    -3, -1.5, 0.5, 3.5, 5, 
    # Bottom Line (Wrist back to Armpit)
    5, 3.5, 0.5, -1.5, -3
  ),
  y = c(
    # Top Line Heights
    4, 4.5, 6.0, 4.5, 5.0,
    # Bottom Line Heights
    5.0, 3.0, 1.5, 2.0, 1.8
  )
)


# 2. Generate the Smooth Spline Curves
# We split by 'part' to get two distinct clean lines
top_curve <- as.data.frame(spline(anchors$x[1:5], anchors$y[1:5], n = 200))
bot_curve <- as.data.frame(spline(anchors$x[6:10], anchors$y[6:10], n = 200))
top_curve$group <- "Top"
bot_curve$group <- "Bottom"
curve_data <- rbind(top_curve, bot_curve)

# 3. Create the Logo
ggplot() +
  # A. The Smooth Lines (The Muscle)
  geom_path(data = curve_data, aes(x = x, y = y, group = group), 
            color = "#2c3e50", size = 2, lineend = "round") +
  
  # B. The Control Points (The "Spline" Concept)
  # White fill with dark outline makes them look like vector nodes
  geom_point(data = anchors, aes(x = x, y = y), 
             size = 6, color = "#2c3e50", fill = "white", shape = 21, stroke = 2) +
  
  # C. The Brand Name
  annotate("text", x = 1, y = -1.5, label = "SPLINE FITNESS", 
           size = 8, fontface = "bold", color = "#2c3e50", family = "sans") +
  
  # D. Logo Formatting (Removing all chart elements)
  coord_fixed(ratio = 1, ylim = c(-2, 9)) + # Set limits to make room for text
  theme_void() + # Removes axes, background, grids
  theme(
    plot.margin = margin(1, 1, 1, 1, "cm"),
    plot.background = element_rect(fill = "white", color = NA) # White background
  )


# -----

library(ggplot2)
library(showtext) # Required for custom Google Fonts

# 1. Setup Custom Font (The "Brand" Look)
# Loading 'Montserrat' - sleek, geometric, and modern
font_add_google("Montserrat", "montserrat")
showtext_auto()

# 2. Define the Simplified Anchor Points (3 points per line)
anchors <- data.frame(
  part = c(rep("Top", 3), rep("Bottom", 3)),
  x = c(
    # Top Line: Shoulder -> Bicep Peak -> Wrist
    -3,  0.5,  5, 
    # Bottom Line: Wrist -> Elbow/Tricep -> Armpit
     5,  0.5, -3
  ),
  y = c(
    # Top Heights (Pushed the middle up slightly to hold the curve)
    3.5, 6.5, 4.5,
    # Bottom Heights (Pushed the middle down to define the muscle belly)
    4.5, 1.2, 2.0
  )
)

# 3. Generate Smooth Splines
# With fewer points, the spline interpolation creates a cleaner, more 'logo-like' arc
top_curve <- as.data.frame(spline(anchors$x[1:3], anchors$y[1:3], n = 200))
bot_curve <- as.data.frame(spline(anchors$x[4:6], anchors$y[4:6], n = 200))
top_curve$group <- "Top"
bot_curve$group <- "Bottom"
curve_data <- rbind(top_curve, bot_curve)

# 4. Create the Logo
p <- ggplot() +
  # A. The Muscle Lines
  geom_path(data = curve_data, aes(x = x, y = y, group = group), 
            color = "#2c3e50", linewidth = 2.5, lineend = "round") +
  
  # B. The Control Points (3 per side)
  geom_point(data = anchors, aes(x = x, y = y), 
             size = 7, color = "#2c3e50", fill = "white", shape = 21, stroke = 2.5) +
  
  # C. The Brand Name
  # Using the new Montserrat font, uppercase, bold
  annotate("text", x = 1, y = -1.5, label = "SPLINE FITNESS", 
           size = 10, fontface = "bold", color = "#2c3e50", family = "montserrat") +
  
  # D. Formatting
  coord_fixed(ratio = 1, ylim = c(-2.5, 8)) + 
  theme_void() + 
  theme(
    plot.margin = margin(10, 10, 10, 10),
    plot.background = element_rect(fill = "transparent", color = NA), # Transparent bg for Web
    panel.background = element_rect(fill = "transparent", color = NA)
  )

print(p)

# 5. Export for React (SVG Format)
# SVG is scalable and code-editable, perfect for web apps.
ggsave("spline_logo.svg", plot = p, width = 6, height = 6, bg = "transparent")
