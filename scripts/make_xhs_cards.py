from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

OUT = Path("/Users/mengwangran/Desktop/跃历宣发图")
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1080, 1440
BG = "#f1efe7"
INK = "#202124"
MUTED = "#6e6b63"
LINE = "#cfcac0"
RED = "#e93434"
MINT = "#b9efe2"
PAPER = "#fbfaf5"
DARK = "#242426"

FONT_CN = "/System/Library/Fonts/Hiragino Sans GB.ttc"
FONT_HEI = "/System/Library/Fonts/STHeiti Medium.ttc"
FONT_ARIAL_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_ARIAL_NARROW = "/System/Library/Fonts/Supplemental/Arial Narrow.ttf"
FONT_ARIAL = "/System/Library/Fonts/Supplemental/Arial.ttf"


def font(path, size, index=0):
    return ImageFont.truetype(path, size=size, index=index)


F = {
    "cn20": font(FONT_CN, 20),
    "cn24": font(FONT_CN, 24),
    "cn28": font(FONT_CN, 28),
    "cn32": font(FONT_CN, 32),
    "cn38": font(FONT_CN, 38),
    "cn46": font(FONT_HEI, 46),
    "cn58": font(FONT_HEI, 58),
    "cn72": font(FONT_HEI, 72),
    "cn88": font(FONT_HEI, 88),
    "cn_display": font(FONT_HEI, 196),
    "en18": font(FONT_ARIAL_BOLD, 18),
    "en24": font(FONT_ARIAL_BOLD, 24),
    "en32": font(FONT_ARIAL_BOLD, 32),
    "en56": font(FONT_ARIAL_BOLD, 56),
    "display": font(FONT_ARIAL_NARROW, 218),
}


def text_size(draw, text, f):
    box = draw.textbbox((0, 0), text, font=f)
    return box[2] - box[0], box[3] - box[1]


def wrap(draw, text, f, max_width):
    lines, line = [], ""
    for ch in text:
        test = line + ch
        if text_size(draw, test, f)[0] <= max_width or not line:
            line = test
        else:
            lines.append(line)
            line = ch
    if line:
        lines.append(line)
    return lines


def draw_wrapped(draw, xy, text, f, fill=INK, max_width=800, line_gap=10):
    x, y = xy
    for line in wrap(draw, text, f, max_width):
        draw.text((x, y), line, font=f, fill=fill)
        y += text_size(draw, line, f)[1] + line_gap
    return y


def draw_tracked(draw, xy, text, f, fill=INK, tracking=14):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill)
        x += text_size(draw, ch, f)[0] + tracking
    return x


def base():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    for x in range(60, W, 88):
        d.line((x, 0, x, H), fill="#e3e0d7", width=1)
    for y in range(80, H, 88):
        d.line((0, y, W, y), fill="#e3e0d7", width=1)
    d.rectangle((0, 0, W - 1, H - 1), outline=LINE, width=3)
    return img, d


def pill(draw, xy, text, fill=PAPER, outline=LINE, text_fill=INK):
    x, y = xy
    pad_x, pad_y = 22, 11
    tw, th = text_size(draw, text, F["cn24"])
    draw.rectangle((x, y, x + tw + pad_x * 2, y + th + pad_y * 2), fill=fill, outline=outline, width=2)
    draw.text((x + pad_x, y + pad_y - 2), text, font=F["cn24"], fill=text_fill)
    return x + tw + pad_x * 2


def footer(draw, idx):
    draw.line((72, H - 96, W - 72, H - 96), fill=LINE, width=2)
    draw.text((72, H - 66), "跃历", font=F["cn20"], fill=INK)
    draw.text((116, H - 66), "/ Career Leap", font=F["en18"], fill=INK)
    draw.text((W - 146, H - 66), f"0{idx}/05", font=F["en18"], fill=MUTED)


def mini_resume(draw, box, title, dark=False, dense=False, tag=None):
    x1, y1, x2, y2 = box
    fill = DARK if dark else PAPER
    fg = "#f7f7f0" if dark else INK
    subtle = "#a9a9a0" if dark else MUTED
    draw.rectangle(box, fill=fill, outline=LINE if not dark else DARK, width=2)
    draw.text((x1 + 30, y1 + 28), title, font=F["cn32"], fill=fg)
    if tag:
        draw.text((x2 - 132, y1 + 33), tag, font=F["en18"], fill=subtle)
    draw.line((x1 + 30, y1 + 92, x2 - 30, y1 + 92), fill=fg if dark else INK, width=3)
    y = y1 + 125
    count = 8 if dense else 4
    widths = [0.88, 0.74, 0.92, 0.66, 0.82, 0.76, 0.90, 0.70]
    for i in range(count):
        ww = int((x2 - x1 - 70) * widths[i])
        h = 16 if dense else 22
        draw.rounded_rectangle((x1 + 35, y, x1 + 35 + ww, y + h), radius=2, fill="#d5d2c8" if not dark else "#686866")
        y += 34 if dense else 58
    if not dense:
        draw.text((x1 + 35, y2 - 86), "空泛 / 跑版 / AI味", font=F["cn24"], fill=subtle)


def arrow(draw, x, y):
    draw.line((x, y, x + 84, y), fill=INK, width=5)
    draw.polygon([(x + 84, y), (x + 60, y - 16), (x + 60, y + 16)], fill=INK)


def save(img, name):
    path = OUT / name
    img.save(path, quality=96)
    return path


def card1():
    img, d = base()
    d.text((58, 52), "从零散经历到高匹配简历，只差一次跃历", font=F["cn24"], fill=INK)
    draw_tracked(d, (58, 150), "跃历", F["cn_display"], INK, 18)
    d.text((704, 218), "Career Leap", font=F["en56"], fill=INK)
    draw_wrapped(d, (710, 300), "上传已有简历、经历素材和目标岗位，AI 先守住事实，再重组表达、补足 STAR，生成一页能投递的 A4 简历。", F["cn28"], MUTED, 300, 10)
    d.rectangle((72, 620, 1008, 1120), fill="#e5e2d8", outline=LINE, width=2)
    mini_resume(d, (104, 666, 420, 1066), "原始经历", dark=True, dense=False)
    arrow(d, 476, 866)
    mini_resume(d, (610, 666, 976, 1066), "高匹配 A4", dark=False, dense=True, tag="FACT FIRST")
    pill(d, (72, 1188), "一页 A4")
    pill(d, (230, 1188), "STAR 补足")
    pill(d, (410, 1188), "事实优先")
    footer(d, 1)
    return save(img, "01-跃历封面.png")


def card2():
    img, d = base()
    d.text((72, 74), "普通 AI 写简历，为什么总差一口气？", font=F["cn58"], fill=INK)
    d.text((74, 170), "它会写，但不一定懂求职场景。", font=F["cn32"], fill=MUTED)
    items = [("空泛", "把经历写成漂亮废话，HR 看完还是不知道你做过什么。"),
             ("乱排", "预览像一页，导出像另一页，照片和文字还可能变形。"),
             ("会编", "没提供的数据也敢写，真实感反而变差。")]
    y = 310
    for label, desc in items:
        d.rectangle((76, y, 1004, y + 180), fill=PAPER, outline=LINE, width=2)
        d.text((112, y + 42), label, font=F["cn58"], fill=RED if label == "会编" else INK)
        draw_wrapped(d, (296, y + 50), desc, F["cn28"], MUTED, 620, 8)
        y += 220
    d.rectangle((76, 1018, 1004, 1186), fill=DARK, outline=DARK)
    d.text((112, 1062), "跃历的解法", font=F["cn38"], fill="#f7f8f4")
    d.text((112, 1120), "先守住事实，再重组表达和版面。", font=F["cn32"], fill=MINT)
    footer(d, 2)
    return save(img, "02-痛点对比.png")


def card3():
    img, d = base()
    d.text((72, 70), "跃前 / 跃后", font=F["cn72"], fill=INK)
    d.text((76, 166), "同样的经历，差在重组、取舍和排版。", font=F["cn30"] if "cn30" in F else F["cn28"], fill=MUTED)
    mini_resume(d, (72, 270, 500, 1020), "跃前", dark=True, dense=False)
    mini_resume(d, (580, 270, 1008, 1020), "跃后", dark=False, dense=True, tag="A4")
    arrow(d, 498, 650)
    d.rectangle((72, 1086, 1008, 1208), fill=PAPER, outline=LINE, width=2)
    d.text((108, 1128), "不是“润色一下”，而是把零散材料重组成岗位能看懂的证据。", font=F["cn28"], fill=INK)
    footer(d, 3)
    return save(img, "03-跃前跃后.png")


def card4():
    img, d = base()
    d.text((72, 72), "4 步生成一页能投递的简历", font=F["cn58"], fill=INK)
    steps = [
        ("01", "上传资料", "已有简历、经历素材、截图或文字都可以先丢进来。"),
        ("02", "填写岗位", "只写岗位名也能开始；有完整 JD 会更精准。"),
        ("03", "自动成页", "按教育、实习、项目、校园经历组织成一页 A4。"),
        ("04", "继续微调", "不想写 prompt，就点轻量按钮：更数据化、更简洁、更适合校招。"),
    ]
    y = 230
    for no, title, desc in steps:
        d.rectangle((72, y, 1008, y + 178), fill=PAPER, outline=LINE, width=2)
        d.text((112, y + 42), no, font=F["en56"], fill=RED if no == "03" else INK)
        d.text((254, y + 36), title, font=F["cn38"], fill=INK)
        draw_wrapped(d, (254, y + 92), desc, F["cn24"], MUTED, 650, 6)
        y += 205
    d.rectangle((72, 1110, 1008, 1210), fill=DARK, outline=DARK)
    d.text((112, 1144), "少做选择题，把精力留给真正的求职判断。", font=F["cn30"] if "cn30" in F else F["cn28"], fill="#f7f8f4")
    footer(d, 4)
    return save(img, "04-工作流.png")


def card5():
    img, d = base()
    d.text((72, 72), "跃历适合谁？", font=F["cn72"], fill=INK)
    d.text((76, 172), "不只跨行，也适合所有“经历很多但说不清”的人。", font=F["cn28"], fill=MUTED)
    groups = [
        ("转行求职", "把过往经历翻译成目标岗位听得懂的能力。"),
        ("校招 / 实习", "从校园、项目、比赛里提取可投递的职业表达。"),
        ("作品型简历", "把产品、GitHub、作品链接嵌入经历，而不是堆在开头。"),
        ("简历重写", "已有简历不好看、不够满、不够像真实经历时，用它重组。"),
    ]
    positions = [(72, 300), (560, 300), (72, 676), (560, 676)]
    for (title, desc), (x, y) in zip(groups, positions):
        d.rectangle((x, y, x + 448, y + 310), fill=PAPER, outline=LINE, width=2)
        d.text((x + 34, y + 42), title, font=F["cn38"], fill=INK)
        draw_wrapped(d, (x + 34, y + 116), desc, F["cn26"] if "cn26" in F else F["cn24"], MUTED, 360, 8)
    d.rectangle((72, 1070, 1008, 1218), fill=DARK, outline=DARK)
    d.text((112, 1114), "一句话：让 HR 一眼看到，你真的有东西。", font=F["cn38"], fill=MINT)
    footer(d, 5)
    return save(img, "05-适合人群.png")


if __name__ == "__main__":
    paths = [card1(), card2(), card3(), card4(), card5()]
    print("\n".join(str(p) for p in paths))
