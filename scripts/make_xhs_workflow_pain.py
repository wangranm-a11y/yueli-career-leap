from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math
import random

W, H = 1080, 1440
DESKTOP = Path("/Users/mengwangran/Desktop")
OUT_LINE = DESKTOP / "跃历宣发图-工作流痛点-V1线稿版"
OUT_PRODUCT = DESKTOP / "跃历宣发图-工作流痛点-V2产品版"
OUT_LINE.mkdir(parents=True, exist_ok=True)
OUT_PRODUCT.mkdir(parents=True, exist_ok=True)

INK = "#202124"
MUTED = "#6f716d"
LIGHT = "#f3f0e8"
PAPER = "#fffdf7"
LINE = "#d7d0c2"
RED = "#e93434"
MINT = "#b8efe3"
BLUE = "#6670ff"
DARK = "#111113"
CHARCOAL = "#1f2023"
SOFT_RED = "#fff4f2"
SOFT_BLUE = "#f1f3ff"

FONT_CN = "/System/Library/Fonts/Hiragino Sans GB.ttc"
FONT_SONG = "/System/Library/Fonts/Supplemental/Songti.ttc"
FONT_HEI = "/System/Library/Fonts/STHeiti Medium.ttc"
FONT_AVENIR = "/System/Library/Fonts/Avenir Next.ttc"
FONT_AVENIR_COND = "/System/Library/Fonts/Avenir Next Condensed.ttc"


def font(path, size, index=0):
    return ImageFont.truetype(path, size=size, index=index)


F = {
    "song120": font(FONT_SONG, 120),
    "song96": font(FONT_SONG, 96),
    "song72": font(FONT_SONG, 72),
    "hei70": font(FONT_HEI, 70),
    "hei58": font(FONT_HEI, 58),
    "hei46": font(FONT_HEI, 46),
    "hei36": font(FONT_HEI, 36),
    "cn32": font(FONT_CN, 32),
    "cn30": font(FONT_CN, 30),
    "cn28": font(FONT_CN, 28),
    "cn26": font(FONT_CN, 26),
    "cn24": font(FONT_CN, 24),
    "cn22": font(FONT_CN, 22),
    "cn18": font(FONT_CN, 18),
    "en46": font(FONT_AVENIR, 46),
    "en28": font(FONT_AVENIR, 28),
    "en20": font(FONT_AVENIR, 20),
    "en16": font(FONT_AVENIR, 16),
    "cond120": font(FONT_AVENIR_COND, 120),
}


def size(d, text, f):
    b = d.textbbox((0, 0), text, font=f)
    return b[2] - b[0], b[3] - b[1]


def wrap(d, text, f, max_w):
    lines, line = [], ""
    for ch in text:
        test = line + ch
        if size(d, test, f)[0] <= max_w or not line:
            line = test
        else:
            lines.append(line)
            line = ch
    if line:
        lines.append(line)
    return lines


def block(d, x, y, text, f, fill=INK, max_w=860, gap=9):
    for line in wrap(d, text, f, max_w):
        d.text((x, y), line, font=f, fill=fill)
        y += size(d, line, f)[1] + gap
    return y


def canvas_line():
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W - 1, H - 1), outline="#eeeeee", width=2)
    return img, d


def canvas_product(dark=False):
    img = Image.new("RGB", (W, H), DARK if dark else LIGHT)
    d = ImageDraw.Draw(img)
    if not dark:
        for x in range(64, W, 96):
            d.line((x, 0, x, H), fill="#e4ded2", width=1)
        for y in range(96, H, 96):
            d.line((0, y, W, y), fill="#e4ded2", width=1)
        d.rectangle((0, 0, W - 1, H - 1), outline=LINE, width=2)
    else:
        for x in range(64, W, 96):
            d.line((x, 0, x, H), fill="#1d1f24", width=1)
        for y in range(96, H, 96):
            d.line((0, y, W, y), fill="#1d1f24", width=1)
    return img, d


def footer(d, idx, dark=False):
    fill = "#f6f7f8" if dark else INK
    muted = "#8d93a0" if dark else MUTED
    d.line((72, H - 92, W - 72, H - 92), fill="#30323a" if dark else "#ded8ce", width=2)
    d.text((72, H - 62), "跃历", font=F["cn18"], fill=fill)
    d.text((116, H - 62), "/ Career Leap", font=F["en16"], fill=fill)
    d.text((W - 140, H - 62), f"{idx:02d}/06", font=F["en16"], fill=muted)


def arrow(d, x1, y1, x2, y2, color=INK, width=4):
    d.line((x1, y1, x2, y2), fill=color, width=width)
    ang = math.atan2(y2 - y1, x2 - x1)
    ah = 18
    pts = [
        (x2, y2),
        (x2 - ah * math.cos(ang - .55), y2 - ah * math.sin(ang - .55)),
        (x2 - ah * math.cos(ang + .55), y2 - ah * math.sin(ang + .55)),
    ]
    d.polygon(pts, fill=color)


def scribble(d, x, y, w, h, seed=1, color=INK, width=3):
    random.seed(seed)
    pts = []
    for i in range(100):
        t = i / 99
        px = x + t * w
        py = y + h/2 + math.sin(t * math.pi * random.uniform(8, 14)) * h * random.uniform(.08, .35) + random.uniform(-h*.2, h*.2)
        pts.append((px, py))
    d.line(pts, fill=color, width=width, joint="curve")


def small_person(d, x, y, s=1, color=INK):
    lw = max(2, int(2*s))
    d.ellipse((x+10*s, y, x+34*s, y+24*s), outline=color, width=lw)
    d.line((x+22*s, y+24*s, x+22*s, y+70*s), fill=color, width=lw)
    d.line((x+22*s, y+42*s, x-8*s, y+56*s), fill=color, width=lw)
    d.line((x+22*s, y+42*s, x+54*s, y+58*s), fill=color, width=lw)
    d.line((x+22*s, y+70*s, x+2*s, y+112*s), fill=color, width=lw)
    d.line((x+22*s, y+70*s, x+48*s, y+112*s), fill=color, width=lw)


def flow_box(d, x, y, w, h, title, desc="", fill=PAPER, outline=LINE, accent=False):
    d.rectangle((x, y, x+w, y+h), fill=fill, outline=RED if accent else outline, width=2)
    d.text((x+24, y+20), title, font=F["cn24"], fill=RED if accent else INK)
    if desc:
        block(d, x+24, y+64, desc, F["cn18"], MUTED, w-48, 5)


def resume_card(d, x, y, w, h, dense=True, dark=False, accent=RED):
    fill = CHARCOAL if dark else PAPER
    fg = "#f7f8f8" if dark else INK
    muted = "#777b84" if dark else "#d6d1c7"
    d.rectangle((x, y, x+w, y+h), fill=fill, outline=INK if not dark else CHARCOAL, width=2)
    d.text((x+28, y+28), "A4 简历" if dense else "原始素材", font=F["cn24"], fill=fg)
    d.line((x+28, y+82, x+w-28, y+82), fill=accent if dense else fg, width=4)
    yy = y+116
    widths = [.86,.64,.92,.78,.88,.70,.80,.62,.90,.74]
    count = 9 if dense else 4
    step = min(34, max(24, int((h-150)/max(1, count-1))))
    for i in range(count):
        ww = int((w-70)*widths[i])
        color = accent if dense and i in (2, 6) else muted
        d.rounded_rectangle((x+34, yy, x+34+ww, yy+14), radius=3, fill=color)
        yy += step


def title_line(d, title, sub, style="line"):
    if style == "line":
        d.text((72, 72), title, font=F["song96"], fill=INK)
        block(d, 78, 190, sub, F["cn24"], MUTED, 890, 7)
    else:
        d.text((72, 72), title, font=F["hei70"], fill=INK)
        block(d, 78, 168, sub, F["cn24"], MUTED, 880, 7)


def line_01():
    img, d = canvas_line()
    d.text((72, 74), "用 AI 写简历，", font=F["song96"], fill=INK)
    d.text((72, 174), "为什么还是这么累？", font=F["song96"], fill=INK)
    block(d, 78, 308, "因为 AI 给你的往往只是文字，而你真正需要的是：选经历、贴岗位、排版、导出，一次完成。", F["cn28"], MUTED, 860, 10)
    scribble(d, 90, 640, 330, 150, 3, INK, 3)
    for i, label in enumerate(["Chatbot", "模板", "Word", "PDF"]):
        x = 520 + (i % 2) * 180
        y = 560 + (i // 2) * 150
        d.rounded_rectangle((x, y, x+140, y+74), radius=8, outline=LINE, width=2)
        d.text((x+22, y+24), label, font=F["en20"] if label != "模板" else F["cn22"], fill=MUTED)
    small_person(d, 454, 700, 1.0)
    d.line((500, 760, 850, 625), fill=RED, width=4)
    d.line((500, 760, 820, 788), fill=RED, width=4)
    d.line((500, 760, 852, 925), fill=RED, width=4)
    d.rectangle((84, 1058, 996, 1180), outline=INK, width=3)
    d.text((124, 1098), "跃历解决的不是“写一句话”，而是整个简历生产流程。", font=F["cn28"], fill=INK)
    footer(d, 1)
    return save(img, OUT_LINE, "01-封面-为什么AI写简历还是累.png")


def line_02_before():
    img, d = canvas_line()
    title_line(d, "使用前：复杂到想放弃", "整理、提取、复制、排版、返工，每一步都要你自己接住。", "line")
    steps = [
        ("整理零散经历", "从聊天记录、旧简历、项目文档里一点点翻。"),
        ("发给 Chatbot", "还要自己写 prompt，让它提取重点。"),
        ("复制到模板", "文字出来了，但格式还没开始。"),
        ("找排版工具", "换平台、换模板、重新粘贴。"),
        ("手动调格式", "标题、日期、行距、分页全部自己改。"),
        ("导出再返工", "预览像一页，PDF 又不一样。"),
    ]
    coords = [(80,310),(440,310),(80,520),(440,520),(80,730),(440,730)]
    for i, (t, desc) in enumerate(steps):
        x, y = coords[i]
        flow_box(d, x, y, 300, 142, t, desc, fill="white", outline="#cfcfcf", accent=i in (4,5))
        if i < 5:
            nx, ny = coords[i+1]
            arrow(d, x+300, y+72, nx, ny+72, RED if i >= 3 else INK, 3)
    small_person(d, 835, 625, 1.0)
    scribble(d, 800, 560, 170, 96, 8, RED, 4)
    d.text((92, 1020), "核心痛点：AI 给了文字，但没有替你完成投递前的最后一公里。", font=F["cn28"], fill=INK)
    footer(d, 2)
    return save(img, OUT_LINE, "02-使用前工作流.png")


def line_03_after():
    img, d = canvas_line()
    title_line(d, "使用后：一步到可投递", "把乱素材全传上去，输入岗位或 JD，剩下交给跃历。", "line")
    d.rectangle((78, 320, 330, 690), outline=INK, width=3)
    d.text((112, 354), "上传素材", font=F["cn28"], fill=INK)
    for i in range(4):
        scribble(d, 116, 450+i*48, 165, 34, i+20, INK, 2)
    arrow(d, 365, 500, 500, 500, RED, 5)
    d.ellipse((505, 350, 735, 650), outline=INK, width=3)
    d.text((558, 428), "AI 分析", font=F["cn28"], fill=INK)
    d.text((552, 486), "岗位 / JD", font=F["cn22"], fill=MUTED)
    d.arc((550, 530, 690, 610), 190, 350, fill=RED, width=5)
    arrow(d, 760, 500, 900, 500, RED, 5)
    resume_card(d, 782, 285, 230, 520, True, False, RED)
    d.rectangle((90, 920, 990, 1106), outline=RED, width=3)
    d.text((130, 962), "得到的不是一段 AI 文案，", font=F["cn32"], fill=INK)
    d.text((130, 1018), "而是一页能直接投递的 A4 简历。", font=F["cn32"], fill=RED)
    footer(d, 3)
    return save(img, OUT_LINE, "03-使用后工作流.png")


def line_04_diff():
    img, d = canvas_line()
    title_line(d, "普通 AI vs 跃历", "差别不是会不会写，而是有没有把简历做完。", "line")
    d.rectangle((72, 320, 500, 960), outline=INK, width=3)
    d.text((112, 365), "普通 AI", font=F["cn32"], fill=INK)
    d.text((112, 430), "给你：文字", font=F["cn28"], fill=MUTED)
    for i in range(8):
        d.line((112, 520+i*42, 420-random.randint(0, 100), 520+i*42), fill="#bfbfbf", width=5)
    d.text((112, 880), "剩下排版、筛选、导出，还是你自己做。", font=F["cn22"], fill=MUTED)
    d.rectangle((580, 320, 1008, 960), outline=RED, width=3)
    d.text((620, 365), "跃历", font=F["cn32"], fill=RED)
    d.text((620, 430), "给你：可投递简历", font=F["cn28"], fill=INK)
    resume_card(d, 665, 500, 260, 330, True, False, RED)
    d.text((620, 880), "自动筛经历、贴 JD、补 STAR、排成一页 A4。", font=F["cn22"], fill=INK)
    footer(d, 4)
    return save(img, OUT_LINE, "04-普通AI-vs-跃历.png")


def line_05_pain_solution():
    img, d = canvas_line()
    title_line(d, "痛点与解决方案", "跃历解决的是“简历生产链路太碎”的问题。", "line")
    pairs = [
        ("经历太散", "直接上传乱素材"),
        ("不会取舍", "按岗位/JD 自动筛选"),
        ("转行难讲", "把旧经历翻译成新岗位语言"),
        ("排版麻烦", "自动生成一页 A4"),
    ]
    y = 320
    for pain, solution in pairs:
        d.text((100, y), pain, font=F["hei36"], fill=INK)
        arrow(d, 330, y+24, 455, y+24, RED, 4)
        d.text((500, y), solution, font=F["hei36"], fill=RED)
        d.line((96, y+78, 984, y+78), fill="#eeeeee", width=2)
        y += 170
    d.rectangle((92, 1050, 988, 1170), outline=INK, width=3)
    d.text((132, 1092), "重点不是“更会润色”，而是更少折腾。", font=F["cn32"], fill=INK)
    footer(d, 5)
    return save(img, OUT_LINE, "05-痛点与解决方案.png")


def line_06_usecase():
    img, d = canvas_line()
    title_line(d, "两个最强 Use Case", "既能从 0 到 1 写简历，也能帮你跨行投递。", "line")
    d.rectangle((90, 330, 990, 560), outline=INK, width=3)
    d.text((132, 375), "场景一：普通写简历", font=F["cn32"], fill=INK)
    d.text((132, 442), "没有成熟简历也没关系，把经历素材丢进去，先生成一版能投的。", font=F["cn24"], fill=MUTED)
    d.rectangle((90, 650, 990, 920), outline=RED, width=3)
    d.text((132, 700), "场景二：跨行投递", font=F["cn32"], fill=RED)
    d.text((132, 768), "不用从头重写旧人生，跃历会把过往经历翻译成目标岗位看得懂的证据。", font=F["cn24"], fill=INK)
    small_person(d, 140, 1040, .9)
    d.line((200, 1090, 855, 1090), fill=RED, width=5)
    d.text((325, 1126), "旧经历  →  新岗位语言  →  一页 A4", font=F["cn28"], fill=INK)
    footer(d, 6)
    return save(img, OUT_LINE, "06-Use-Case.png")


def save(img, out, name):
    path = out / name
    img.save(path, quality=96)
    return path


def p_title(d, title, sub, dark=False):
    fill = "#f7f8f8" if dark else INK
    muted = "#9aa0aa" if dark else MUTED
    d.text((72, 72), title, font=F["hei70"], fill=fill)
    block(d, 78, 168, sub, F["cn24"], muted, 875, 7)


def p_chip(d, x, y, text, fill=PAPER, text_fill=INK, outline=LINE):
    tw, th = size(d, text, F["cn22"])
    d.rounded_rectangle((x, y, x+tw+36, y+th+20), radius=12, fill=fill, outline=outline, width=1)
    d.text((x+18, y+9), text, font=F["cn22"], fill=text_fill)
    return x+tw+48


def p_01():
    img, d = canvas_product()
    p_title(d, "别再来回横跳了", "Chatbot 写文字，模板管排版，PDF 又跑版。跃历把这些步骤合成一个闭环。")
    d.rectangle((72, 330, 1008, 990), fill="#e7e1d5", outline=LINE, width=2)
    labels = [("经历素材", 118, 420), ("Chatbot", 340, 565), ("简历模板", 580, 420), ("手动排版", 800, 565)]
    for label, x, y in labels:
        d.rectangle((x, y, x+150, y+86), fill=PAPER, outline=LINE, width=2)
        d.text((x+28, y+28), label, font=F["cn22"] if label != "Chatbot" else F["en20"], fill=INK)
    for (x1,y1),(x2,y2) in [((268,463),(340,605)),((490,605),(580,463)),((730,463),(800,605))]:
        arrow(d, x1, y1, x2, y2, RED, 4)
    d.text((145, 815), "复杂", font=F["hei46"], fill=RED)
    d.text((330, 815), "割裂", font=F["hei46"], fill=RED)
    d.text((515, 815), "反复复制", font=F["hei46"], fill=RED)
    d.rectangle((72, 1088, 1008, 1200), fill=DARK, outline=DARK)
    d.text((112, 1128), "跃历：从素材到 A4 PDF，一条链路做完。", font=F["cn30"], fill=MINT)
    footer(d, 1)
    return save(img, OUT_PRODUCT, "01-封面-别再来回横跳.png")


def p_02_before():
    img, d = canvas_product()
    p_title(d, "使用工具前", "一个看似简单的简历需求，会被拆成 6 个麻烦步骤。")
    steps = ["整理一堆经历", "发给 Chatbot", "提取简历内容", "找第三方模板", "复制粘贴排版", "导出返工"]
    y = 310
    for i, step in enumerate(steps):
        x = 92 if i % 2 == 0 else 548
        if i % 2 == 0 and i > 0:
            y += 190
        d.rectangle((x, y, x+390, y+132), fill=PAPER, outline=RED if i >= 4 else LINE, width=2)
        d.text((x+26, y+30), f"0{i+1}", font=F["en28"], fill=RED if i >= 4 else INK)
        d.text((x+96, y+31), step, font=F["cn28"], fill=INK)
        if i < len(steps)-1:
            nx = 548 if i % 2 == 0 else 92
            ny = y if i % 2 == 0 else y+190
            arrow(d, x+390, y+66, nx, ny+66, RED if i >= 3 else MUTED, 3)
    d.rectangle((72, 1100, 1008, 1220), fill=SOFT_RED, outline=RED, width=2)
    d.text((112, 1144), "痛点：AI 只给文字，用户还要自己完成排版与交付。", font=F["cn28"], fill=INK)
    footer(d, 2)
    return save(img, OUT_PRODUCT, "02-使用前工作流.png")


def p_03_after():
    img, d = canvas_product()
    p_title(d, "使用跃历后", "把所有稀里糊涂的经历都传上去，系统自动筛选、改写、排版。")
    d.rectangle((72, 318, 1008, 1058), fill="#e6e0d5", outline=LINE, width=2)
    resume_card(d, 118, 440, 230, 360, False, True, BLUE)
    arrow(d, 390, 610, 500, 610, BLUE, 5)
    d.rounded_rectangle((510, 450, 710, 770), radius=100, fill=PAPER, outline=INK, width=3)
    d.text((555, 548), "AI", font=F["en46"], fill=BLUE)
    d.text((552, 610), "岗位分析", font=F["cn22"], fill=INK)
    arrow(d, 740, 610, 850, 610, BLUE, 5)
    resume_card(d, 790, 380, 180, 480, True, False, BLUE)
    d.rectangle((110, 900, 970, 996), fill=DARK, outline=DARK)
    d.text((150, 930), "直接得到：一页能投递的 A4 简历", font=F["cn30"], fill=MINT)
    footer(d, 3)
    return save(img, OUT_PRODUCT, "03-使用后工作流.png")


def p_04_diff():
    img, d = canvas_product()
    p_title(d, "普通 AI 给文字，跃历给结果", "真正的差异，是它有没有把用户带到“可投递”这一步。")
    d.rectangle((72, 330, 500, 1000), fill=PAPER, outline=LINE, width=2)
    d.text((112, 382), "普通 AI", font=F["hei46"], fill=INK)
    d.text((112, 460), "输出：一段文字", font=F["cn26"], fill=MUTED)
    for i in range(9):
        d.line((112, 560+i*44, 420-(i%3)*55, 560+i*44), fill="#d5d0c8", width=8)
    d.rectangle((580, 330, 1008, 1000), fill=DARK, outline=DARK, width=2)
    d.text((620, 382), "跃历", font=F["hei46"], fill=MINT)
    d.text((620, 460), "输出：一份简历", font=F["cn26"], fill="#f7f8f8")
    resume_card(d, 668, 540, 250, 330, True, False, BLUE)
    d.text((112, 1080), "一句话：少做搬运工，多做求职判断。", font=F["cn32"], fill=INK)
    footer(d, 4)
    return save(img, OUT_PRODUCT, "04-普通AI-vs-跃历.png")


def p_05_pain_solution():
    img, d = canvas_product()
    p_title(d, "痛点与解决方案", "把用户真正烦的地方拆开看，跃历每一步都有对应方案。")
    pairs = [
        ("经历很多但说不清", "上传原始素材"),
        ("不知道该写哪段", "根据岗位/JD 自动筛选"),
        ("跨行表达不贴岗", "重组语言和侧重点"),
        ("排版总是不满一页", "自动生成一页 A4"),
        ("每个 JD 都要重改", "继续和 AI 对话微调"),
    ]
    y = 305
    for i, (pain, sol) in enumerate(pairs):
        d.rectangle((72, y, 1008, y+132), fill=PAPER, outline=LINE, width=2)
        d.text((108, y+38), pain, font=F["cn26"], fill=INK)
        arrow(d, 456, y+66, 555, y+66, RED if i in (1,2) else BLUE, 4)
        d.text((590, y+38), sol, font=F["cn26"], fill=RED if i in (1,2) else BLUE)
        y += 156
    d.rectangle((72, 1114, 1008, 1224), fill=DARK, outline=DARK)
    d.text((112, 1152), "卖点：它不是模板库，是岗位定制简历生成器。", font=F["cn28"], fill=MINT)
    footer(d, 5)
    return save(img, OUT_PRODUCT, "05-痛点与解决方案.png")


def p_06_usecase():
    img, d = canvas_product()
    p_title(d, "两个核心场景", "普通写简历 + 跨行投递，是跃历最适合打透的两个入口。")
    d.rectangle((72, 330, 1008, 560), fill=PAPER, outline=LINE, width=2)
    d.text((112, 380), "01  从 0 到 1 写简历", font=F["hei36"], fill=INK)
    d.text((112, 450), "没有成熟简历也没关系，用原始经历直接生成一版可投递简历。", font=F["cn24"], fill=MUTED)
    d.rectangle((72, 650, 1008, 930), fill=DARK, outline=DARK, width=2)
    d.text((112, 705), "02  跨行投递", font=F["hei36"], fill=MINT)
    d.text((112, 775), "把旧经历翻译成新行业能看懂的能力证据，不用手动重写。", font=F["cn24"], fill="#f3f3f3")
    x = p_chip(d, 92, 1046, "产品经理", BLUE, "white", BLUE)
    x = p_chip(d, x+12, 1046, "运营", PAPER, INK, LINE)
    x = p_chip(d, x+12, 1046, "校招", PAPER, INK, LINE)
    p_chip(d, x+12, 1046, "作品型简历", PAPER, INK, LINE)
    footer(d, 6)
    return save(img, OUT_PRODUCT, "06-Use-Case.png")


def sheet(folder):
    imgs = [Image.open(p).resize((180, 240)) for p in sorted(folder.glob("[0-9][0-9]-*.png"))]
    out = Image.new("RGB", (180*6 + 22*7, 240 + 52), "#f4f0e8")
    d = ImageDraw.Draw(out)
    for i, im in enumerate(imgs):
        x = 22 + i * (180 + 22)
        out.paste(im, (x, 26))
        d.rectangle((x, 26, x+180, 266), outline=LINE, width=1)
    out.save(folder / "00-总览.png", quality=96)


if __name__ == "__main__":
    for folder in (OUT_LINE, OUT_PRODUCT):
        for p in folder.glob("*.png"):
            p.unlink()
    line_paths = [line_01(), line_02_before(), line_03_after(), line_04_diff(), line_05_pain_solution(), line_06_usecase()]
    product_paths = [p_01(), p_02_before(), p_03_after(), p_04_diff(), p_05_pain_solution(), p_06_usecase()]
    sheet(OUT_LINE)
    sheet(OUT_PRODUCT)
    print("LINE")
    print("\n".join(map(str, line_paths)))
    print("PRODUCT")
    print("\n".join(map(str, product_paths)))
