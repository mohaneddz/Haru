import sys

def normalize_netscape_file(infile, outfile):
    with open(infile, "r", encoding="utf-8") as f:
        lines = f.readlines()

    out_lines = []
    out_lines.append("# Netscape HTTP Cookie File\n")

    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        parts = line.split()
        if len(parts) != 7:
            print(f"Skipping invalid line: {line}")
            continue

        # Re-join strictly with tabs
        out_lines.append("\t".join(parts) + "\n")

    with open(outfile, "w", encoding="utf-8", newline="\n") as f:
        f.writelines(out_lines)

    print(f"✅ Normalized file written to {outfile}")


if __name__ == "__main__":
    infile = sys.argv[1]
    outfile = sys.argv[2] if len(sys.argv) > 2 else infile + ".fixed"
    normalize_netscape_file(infile, outfile)
