import os
import math
import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterio.enums import Resampling as REnum
from pyproj import Transformer
from PIL import Image
import time

INPUT_TIF = "D:/UAV-SolarNet/Project/Denchai/Input/DC_RGB.tif"
OUTPUT_DIR = "D:/UAV-SolarNet/06_Solar_Potential_Dashboard/public/tiles/uav"
ZOOM_LEVELS = [14, 15, 16, 17, 18, 19]
WEBP_QUALITY = 78
SCALE_FACTOR = 6  # 5cm -> 30cm

def deg2num(lat_deg, lon_deg, zoom):
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return (xtile, ytile)

def num2deg(xtile, ytile, zoom):
    n = 2.0 ** zoom
    lon_deg = xtile / n * 360.0 - 180.0
    lat_rad = math.atan(math.sinh(math.pi * (1 - 2 * ytile / n)))
    lat_deg = math.degrees(lat_rad)
    return (lat_deg, lon_deg)

def tile_bounds_mercator(xtile, ytile, zoom):
    lat_north, lon_west = num2deg(xtile, ytile, zoom)
    lat_south, lon_east = num2deg(xtile + 1, ytile + 1, zoom)
    trans = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)
    min_x, min_y = trans.transform(lon_west, lat_south)
    max_x, max_y = trans.transform(lon_east, lat_north)
    return (min_x, min_y, max_x, max_y)

def main():
    t0 = time.time()
    print(f"Step 1: Reading & downscaling {INPUT_TIF} (factor={SCALE_FACTOR}x, 5cm -> 30cm)...")
    
    with rasterio.open(INPUT_TIF) as src:
        new_h = src.height // SCALE_FACTOR
        new_w = src.width // SCALE_FACTOR
        print(f"Original: {src.width}x{src.height} -> Target 30cm: {new_w}x{new_h}")
        
        # Read downsampled RGB in one shot
        data = src.read(
            out_shape=(src.count, new_h, new_w),
            resampling=REnum.bilinear
        )
        
        # Adjust transform for the downscaled grid
        new_transform = src.transform * src.transform.scale(
            (src.width / new_w),
            (src.height / new_h)
        )
        
        # Step 2: Reproject 30cm data to Web Mercator (EPSG:3857)
        print(f"Step 2: Reprojecting 30cm data to Web Mercator (EPSG:3857)...")
        dst_crs = "EPSG:3857"
        dst_transform, dst_w, dst_h = calculate_default_transform(
            src.crs, dst_crs, new_w, new_h,
            left=src.bounds.left, bottom=src.bounds.bottom,
            right=src.bounds.right, top=src.bounds.top
        )
        
        merc_data = np.zeros((4, dst_h, dst_w), dtype=np.uint8)
        reproject(
            source=data,
            destination=merc_data[:3],
            src_transform=new_transform,
            src_crs=src.crs,
            dst_transform=dst_transform,
            dst_crs=dst_crs,
            resampling=Resampling.bilinear,
            src_nodata=0,
            dst_nodata=0
        )
        
        # Alpha mask
        mask = (merc_data[0] > 0) | (merc_data[1] > 0) | (merc_data[2] > 0)
        merc_data[3] = np.where(mask, 255, 0).astype(np.uint8)
        
        # WGS84 bounds for tile iteration
        trans_to_wgs = Transformer.from_crs(src.crs, "EPSG:4326", always_xy=True)
        wgs_left, wgs_bottom = trans_to_wgs.transform(src.bounds.left, src.bounds.bottom)
        wgs_right, wgs_top = trans_to_wgs.transform(src.bounds.right, src.bounds.top)
        
        print(f"Step 3: Slicing into XYZ WebP tiles (Zoom {ZOOM_LEVELS})...")
        total_tiles = 0
        
        # Inverse transform for fast pixel coordinate lookup in Web Mercator
        inv_dst_transform = ~dst_transform

        for z in ZOOM_LEVELS:
            min_x_tile, min_y_tile = deg2num(wgs_top, wgs_left, z)
            max_x_tile, max_y_tile = deg2num(wgs_bottom, wgs_right, z)
            
            x_start = min(min_x_tile, max_x_tile)
            x_end = max(min_x_tile, max_x_tile)
            y_start = min(min_y_tile, max_y_tile)
            y_end = max(min_y_tile, max_y_tile)
            
            z_tiles = 0
            for x in range(x_start, x_end + 1):
                col_dir = os.path.join(OUTPUT_DIR, str(z), str(x))
                os.makedirs(col_dir, exist_ok=True)
                
                for y in range(y_start, y_end + 1):
                    tile_path = os.path.join(col_dir, f"{y}.webp")
                    
                    min_mx, min_my, max_mx, max_my = tile_bounds_mercator(x, y, z)
                    
                    # Pixel coordinates in the merc_data grid
                    px_min, py_min = inv_dst_transform * (min_mx, max_my)
                    px_max, py_max = inv_dst_transform * (max_mx, min_my)
                    
                    c_min, c_max = int(min(px_min, px_max)), int(max(px_min, px_max))
                    r_min, r_max = int(min(py_min, py_max)), int(max(py_min, py_max))
                    
                    # Check overlap with data grid
                    if c_max <= 0 or c_min >= dst_w or r_max <= 0 or r_min >= dst_h:
                        continue
                    
                    src_c_min = max(0, c_min)
                    src_c_max = min(dst_w, c_max)
                    src_r_min = max(0, r_min)
                    src_r_max = min(dst_h, r_max)
                    
                    if src_c_max <= src_c_min or src_r_max <= src_r_min:
                        continue
                    
                    tile_crop = merc_data[:, src_r_min:src_r_max, src_c_min:src_c_max]
                    if not np.any(tile_crop[3] > 0):
                        continue
                    
                    # Create 256x256 tile image
                    tile_img = np.zeros((4, 256, 256), dtype=np.uint8)
                    
                    # Mapping crop into 256x256
                    t_c_min = int((src_c_min - c_min) / (c_max - c_min) * 256)
                    t_c_max = int((src_c_max - c_min) / (c_max - c_min) * 256)
                    t_r_min = int((src_r_min - r_min) / (r_max - r_min) * 256)
                    t_r_max = int((src_r_max - r_min) / (r_max - r_min) * 256)
                    
                    t_w = max(1, t_c_max - t_c_min)
                    t_h = max(1, t_r_max - t_r_min)
                    
                    crop_pil = Image.fromarray(np.transpose(tile_crop, (1, 2, 0)), mode="RGBA")
                    crop_resized = crop_pil.resize((t_w, t_h), Image.Resampling.BILINEAR)
                    
                    tile_pil = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
                    tile_pil.paste(crop_resized, (t_c_min, t_r_min))
                    
                    tile_pil.save(tile_path, "WEBP", quality=WEBP_QUALITY, method=3)
                    z_tiles += 1
                    total_tiles += 1
            
            print(f"  Zoom {z}: Generated {z_tiles} tiles")
        
        elapsed = time.time() - t0
        print(f"\n[DONE] Generated {total_tiles} WebP tiles in {elapsed:.1f}s at {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
