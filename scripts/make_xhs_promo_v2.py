from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math
import random

W, H = 1080, 1440
DESKTOP = Path("/Users/mengwangran/Desktop")
OUT1 = DESKTOP / "跃历宣发图-V1-线稿版"
OUT2 = DESKTOP / "跃历宣发图-V2-杂志版"
OUT1.mkdir(parents=True, exist_ok=True)
OUT2.mkdir(parents=True, exist_ok=True)

INK = "#1f2023"
MUTED = "#707070"
SOFT = "#f5f1e8"
PAPER = "#fffdf7"
LINE = "#d8d1c4"
RED = "#e93434"
MINT = "#b8efe3"
DARK = "#09090a"
CHARCOAL = "#161719"
BLUE = "#6d76ff"

FONT_CN = "/System/Library/Fonts/Hiragino Sans GB.ttc"
FONT_SONG = "/System/Library/Fonts/Supplemental/Songti.ttc"
FONT_HEI = "/System/Library/Fonts/STHeiti Medium.ttc"
FONT_AVENIR = "/System/Library/Fonts/Avenir Next.ttc"
FONT_AVENIR_COND = "/System/Library/Fonts/Avenir Next Condensed.ttc"
FONT_HELV = "/System/Library/Fonts/HelveticaNeue.ttc"


def font(path, size, index=0):
    return ImageFont.truetype(path, size=size, index=index)


F = {
    "song_180": font(FONT_SONG, 180),
    "song_136": font(FONT_SONG, 136),
    "song_92": font(FONT_SONG, 92),
    "hei_72": font(FONT_HEI, 72),
    "hei_60": font(FONT_HEI, 60),
    "hei_46": font(FONT_HEI, 46),
    "cn_36": font(FONT_CN, 36),
    "cn_30": font(FONT_CN, 30),
    "cn_26": font(FONT_CN, 26),
    "cn_22": font(FONT_CN, 22),
    "cn_18": font(FONT_CN, 18),
    "en_72": font(FONT_AVENIR_COND, 72),
    "en_46": font(FONT_AVENIR, 46),
    "en_28": font(FONT_AVENIR, 28),
    "en_18": font(FONT_AVENIR, 18),
    "mono_20": font(FONT_HELV, 20),
}


def size(d, text, f):
    box = d.textbbox((0, 0), text, font=f)
    return box[2] - box[0], box[3] - box[1]


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


def text_block(d, x, y, text, f, fill=INK, max_w=760, gap=10):
    for line in wrap(d, text, f, max_w):
        d.text((x, y), line, font=f, fill=fill)
        y += size(d, line, f)[1] + gap
    return y


def tracked(d, x, y, text, f, fill=INK, gap=10):
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill)
        x += size(d, ch, f)[0] + gap
    return x


def line_canvas():
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W - 1, H - 1), outline="#eeeeee", width=2)
    return img, d


def mag_canvas():
    img = Image.new("RGB", (W, H), SOFT)
    d = ImageDraw.Draw(img)
    for x in range(64, W, 96):
        d.line((x, 0, x, H), fill="#e6dfd3", width=1)
    for y in range(96, H, 96):
        d.line((0, y, W, y), fill="#e6dfd3", width=1)
    d.rectangle((0, 0, W - 1, H - 1), outline=LINE, width=2)
    return img, d


def footer_line(d, idx, dark=False):
    fill = "#f4f4f4" if dark else INK
    muted = "#8f9299" if dark else MUTED
    d.line((70, H - 92, W - 70, H - 92), fill="#2d2f36" if dark else "#e4e4e4", width=2)
    d.text((70, H - 62), "跃历", font=F["cn_18"], fill=fill)
    d.text((116, H - 62), "/ Career Leap", font=F["en_18"], fill=fill)
    d.text((W - 140, H - 62), f"0{idx}/05", font=F["en_18"], fill=muted)


def person(d, x, y, s=1, color=INK):
    d.ellipse((x + 10*s, y, x + 34*s, y + 24*s), outline=color, width=max(2, int(2*s)))
    d.line((x + 22*s, y + 24*s, x + 20*s, y + 72*s), fill=color, width=max(2, int(2*s)))
    d.line((x + 20*s, y + 42*s, x - 6*s, y + 58*s), fill=color, width=max(2, int(2*s)))
    d.line((x + 20*s, y + 42*s, x + 50*s, y + 54*s), fill=color, width=max(2, int(2*s)))
    d.line((x + 20*s, y + 72*s, x + 2*s, y + 112*s), fill=color, width=max(2, int(2*s)))
    d.line((x + 20*s, y + 72*s, x + 46*s, y + 112*s), fill=color, width=max(2, int(2*s)))


def scribble(d, x, y, w, h, color=INK, width=3, seed=0):
    random.seed(seed)
    pts = []
    for i in range(90):
        t = i / 89
        px = x + t * w
        py = y + h/2 + math.sin(t * 10 * math.pi) * h * random.uniform(.12, .46) + random.uniform(-h*.25, h*.25)
        pts.append((px, py))
    d.line(pts, fill=color, width=width, joint="curve")


def resume_sheet(d, box, title="高匹配 A4", dense=True, dark=False, accent=RED):
    x1, y1, x2, y2 = box
    bg = CHARCOAL if dark else PAPER
    fg = "#f7f7f0" if dark else INK
    line = "#363941" if dark else LINE
    d.rectangle(box, fill=bg, outline=line, width=2)
    d.text((x1 + 34, y1 + 30), title, font=F["cn_30"], fill=fg)
    d.line((x1 + 34, y1 + 92, x2 - 34, y1 + 92), fill=accent if dense else fg, width=4)
    y = y1 + 130
    widths = [.84, .66, .91, .74, .88, .70, .80, .62, .86, .76, .92]
    count = 10 if dense else 4
    if y2 - y1 < 500:
        count = 7 if dense else 4
    step = min(34 if dense else 58, max(24, int((y2 - y - 36) / max(1, count - 1))))
    for i, ww in enumerate(widths[:count]):
        h = 13 if dense else 20
        fill = "#d8d3c7" if not dark else "#65686f"
        if dense and i in (2, 6):
            fill = accent
        d.rounded_rectangle((x1 + 40, y, x1 + 40 + int((x2-x1-90)*ww), y + h), radius=3, fill=fill)
        y += step


def arrow(d, x, y, w=130, color=INK):
    d.line((x, y, x + w, y), fill=color, width=6)
    d.polygon([(x+w, y), (x+w-26, y-18), (x+w-26, y+18)], fill=color)


def save(img, out, name):
    path = out / name
    img.save(path, quality=96)
    return path


def v1_card1():
    img, d = line_canvas()
    d.text((72, 72), "从零散经历到高匹配简历，只差一次跃历", font=F["cn_26"], fill=INK)
    tracked(d, 72, 256, "跃历", F["song_180"], INK, 18)
    d.text((580, 275), "Career Leap", font=F["en_46"], fill=INK)
    text_block(d, 584, 342, "上传已有简历、经历素材和目标岗位，AI 先守住事实，再重组表达、补足 STAR，生成一页能投递的 A4 简历。", F["cn_26"], MUTED, 395, 8)
    scribble(d, 90, 780, 300, 150, INK, 3, 2)
    person(d, 430, 756, 1.0)
    d.line((500, 838, 668, 838), fill=RED, width=4)
    d.arc((650, 760, 880, 920), 190, 348, fill=RED, width=4)
    resume_sheet(d, (690, 680, 980, 1030), "A4 简历", True, False, RED)
    d.line((90, 1100, 990, 1100), fill="#eeeeee", width=2)
    d.text((90, 1140), "一个事实锚点，一页能投递的表达。", font=F["cn_30"], fill=INK)
    footer_line(d, 1)
    return save(img, OUT1, "01-封面.png")


def v1_card2():
    img, d = line_canvas()
    d.text((72, 82), "普通 AI", font=F["song_92"], fill=INK)
    d.text((72, 180), "为什么写不好简历？", font=F["song_92"], fill=INK)
    d.text((78, 300), "它会生成文字，但不一定知道什么该留下。", font=F["cn_26"], fill=MUTED)
    for i in range(9):
        x = 110 + (i % 3) * 250
        y = 430 + (i // 3) * 130
        d.rounded_rectangle((x, y, x+170, y+70), radius=8, outline="#bbbbbb", width=2)
        d.line((x+25, y+25, x+145, y+25), fill="#bbbbbb", width=3)
        d.line((x+25, y+46, x+105, y+46), fill="#d8d8d8", width=3)
    person(d, 795, 700, .8)
    d.line((815, 748, 744, 634), fill=RED, width=5)
    d.text((136, 920), "空泛", font=F["hei_46"], fill=INK)
    d.text((420, 920), "跑版", font=F["hei_46"], fill=INK)
    d.text((700, 920), "会编", font=F["hei_46"], fill=RED)
    d.rectangle((90, 1045, 990, 1198), outline=INK, width=3)
    d.text((130, 1090), "跃历做减法：守住事实，留下对岗位有用的证据。", font=F["cn_30"], fill=INK)
    footer_line(d, 2)
    return save(img, OUT1, "02-普通AI痛点.png")


def v1_card3():
    img, d = line_canvas()
    d.text((72, 80), "跃前 / 跃后", font=F["song_92"], fill=INK)
    d.text((78, 198), "对比要一眼看懂：左边是零散经历，右边是高匹配 A4。", font=F["cn_24"] if "cn_24" in F else F["cn_22"], fill=MUTED)
    d.rectangle((82, 330, 452, 1010), outline=INK, width=3)
    d.text((120, 370), "原始经历", font=F["cn_30"], fill=INK)
    for i in range(5):
        scribble(d, 124, 470 + i*85, 250, 60, INK, 3, 10+i)
    d.text((132, 910), "零散 / 不贴岗 / 不成页", font=F["cn_22"], fill=MUTED)
    arrow(d, 480, 662, 120, RED)
    resume_sheet(d, (635, 250, 1000, 1130), "高匹配 A4", True, False, RED)
    d.rectangle((82, 1168, 1000, 1252), fill="#fff6f4", outline=RED, width=2)
    d.text((120, 1192), "不是“润色一下”，是把素材重组成岗位能看懂的证据。", font=F["cn_26"], fill=INK)
    footer_line(d, 3)
    return save(img, OUT1, "03-跃前跃后.png")


def v1_card4():
    img, d = line_canvas()
    d.text((72, 82), "事实优先", font=F["song_92"], fill=INK)
    d.text((78, 198), "不编公司、时间、奖项和数据。没给的事实，就让用户补充。", font=F["cn_26"], fill=MUTED)
    resume_sheet(d, (248, 350, 832, 1020), "真实经历", True, False, RED)
    person(d, 165, 675, .85)
    d.line((210, 735, 324, 670), fill=INK, width=3)
    d.ellipse((310, 648, 362, 700), outline=RED, width=5)
    d.line((336, 700, 336, 785), fill=RED, width=5)
    d.arc((306, 746, 366, 806), 0, 180, fill=RED, width=5)
    d.text((240, 1090), "把真实经历翻译成岗位证据，而不是替你编一个漂亮故事。", font=F["cn_30"], fill=INK)
    footer_line(d, 4)
    return save(img, OUT1, "04-事实优先.png")


def v1_card5():
    img, d = line_canvas()
    d.text((72, 82), "适合谁？", font=F["song_92"], fill=INK)
    labels = ["转行求职", "校招实习", "作品型简历", "简历重写"]
    for i, lab in enumerate(labels):
        x = 150 + (i % 2) * 390
        y = 350 + (i // 2) * 250
        d.ellipse((x, y, x+220, y+140), outline=INK, width=3)
        d.text((x+42, y+52), lab, font=F["cn_26"], fill=INK)
    person(d, 500, 805, 1.0)
    d.arc((240, 700, 835, 1100), 205, 335, fill=RED, width=5)
    d.text((122, 1130), "一句话：让 HR 一眼看到，你真的有东西。", font=F["cn_36"], fill=INK)
    footer_line(d, 5)
    return save(img, OUT1, "05-适合人群.png")


def mag_header(d, title, sub, dark=False):
    fill = "#f7f8f8" if dark else INK
    muted = "#9aa0aa" if dark else MUTED
    d.text((72, 70), title, font=F["hei_72"], fill=fill)
    text_block(d, 76, 168, sub, F["cn_24"] if "cn_24" in F else F["cn_22"], muted, 890, 8)


def chip(d, x, y, text, dark=False, accent=False):
    bg = BLUE if accent else (CHARCOAL if dark else PAPER)
    fg = "white" if accent or dark else INK
    outline = "#30323a" if dark else LINE
    tw, th = size(d, text, F["cn_22"])
    d.rounded_rectangle((x, y, x+tw+36, y+th+20), radius=10, fill=bg, outline=outline, width=1)
    d.text((x+18, y+9), text, font=F["cn_22"], fill=fg)
    return x + tw + 48


def v2_card1():
    img, d = mag_canvas()
    tracked(d, 72, 278, "跃历", F["song_180"], INK, 14)
    d.text((568, 298), "Career Leap", font=F["en_46"], fill=INK)
    text_block(d, 572, 365, "从零散经历到高匹配简历，只差一次跃历。上传已有简历、经历素材和目标岗位，生成一页能投递的 A4 简历。", F["cn_26"], MUTED, 390, 8)
    d.rectangle((72, 640, 1008, 1110), fill="#e8e3d8", outline=LINE, width=2)
    resume_sheet(d, (106, 700, 420, 1046), "原始经历", False, True, BLUE)
    arrow(d, 476, 875, 90, BLUE)
    resume_sheet(d, (626, 700, 974, 1046), "高匹配 A4", True, False, BLUE)
    x = 72
    for i, t in enumerate(["FACT FIRST", "ONE PAGE A4", "STAR"]):
        x = chip(d, x, 1175, t, False, i == 0) + 12
    footer_line(d, 1)
    return save(img, OUT2, "01-封面.png")


def v2_card2():
    img, d = mag_canvas()
    mag_header(d, "普通 AI 的三种翻车", "不是它不会写，是它常常不知道求职简历真正要证明什么。")
    cards = [("01", "空泛", "写成漂亮废话，看起来顺，但缺少可验证动作。"),
             ("02", "跑版", "预览和导出不一致，一页 A4 变成半页或变形。"),
             ("03", "会编", "没有提供的数据也敢写，真实感反而被削弱。")]
    y = 310
    for no, title, desc in cards:
        d.rectangle((72, y, 1008, y+190), fill=PAPER, outline=LINE, width=2)
        d.text((112, y+52), no, font=F["en_46"], fill=RED if no == "03" else INK)
        d.text((258, y+45), title, font=F["hei_46"], fill=INK)
        d.text((258, y+108), desc, font=F["cn_26"], fill=MUTED)
        y += 230
    d.rectangle((72, 1065, 1008, 1198), fill=DARK, outline=DARK)
    d.text((112, 1105), "跃历：先守事实，再做表达重组。", font=F["cn_36"], fill=MINT)
    footer_line(d, 2)
    return save(img, OUT2, "02-痛点.png")


def v2_card3():
    img, d = mag_canvas()
    mag_header(d, "跃前 / 跃后", "这张要直接让人看出差别：从混乱材料，到可投递的一页 A4。")
    d.rectangle((72, 300, 482, 1056), fill=DARK, outline=DARK)
    d.text((112, 346), "跃前", font=F["hei_46"], fill="#f7f8f8")
    for i in range(7):
        scribble(d, 122, 470+i*65, 260, 42, "#777777", 5, 30+i)
    d.text((118, 940), "零散经历", font=F["cn_26"], fill="#a5a5a5")
    d.text((118, 982), "不贴岗位", font=F["cn_26"], fill="#a5a5a5")
    arrow(d, 505, 682, 95, RED)
    d.rectangle((630, 245, 1008, 1130), fill=PAPER, outline=INK, width=3)
    d.text((670, 300), "跃后", font=F["hei_46"], fill=INK)
    d.text((888, 312), "A4", font=F["en_28"], fill=RED)
    d.line((670, 382, 966, 382), fill=RED, width=5)
    y = 440
    for i, ww in enumerate([.90,.72,.96,.84,.92,.76,.88,.69,.94,.80,.90,.75]):
        d.rounded_rectangle((670, y, 670+int(280*ww), y+16), radius=3, fill=RED if i in (2,7) else "#d4d0c6")
        y += 42
    d.rectangle((72, 1175, 1008, 1258), fill=PAPER, outline=RED, width=2)
    d.text((112, 1200), "不是润色，是把素材重组成岗位能看懂的证据。", font=F["cn_28"] if "cn_28" in F else F["cn_26"], fill=INK)
    footer_line(d, 3)
    return save(img, OUT2, "03-跃前跃后.png")


def v2_card4():
    img, d = mag_canvas()
    mag_header(d, "一页 A4 的生成逻辑", "经历优先，技能和个人概述只做最后补位。")
    steps = [("教育", "专业、GPA、奖项、语言能力先归位"),
             ("实习", "有公司/岗位就突出实习经历"),
             ("项目", "作品和链接嵌入项目标题或右侧"),
             ("校园", "低相关经历也转译成迁移能力")]
    y = 300
    for i, (a, b) in enumerate(steps):
        d.rectangle((72, y, 1008, y+170), fill=PAPER, outline=LINE, width=2)
        d.text((112, y+48), f"0{i+1}", font=F["en_46"], fill=BLUE if i == 1 else INK)
        d.text((256, y+43), a, font=F["hei_46"], fill=INK)
        d.text((256, y+106), b, font=F["cn_24"] if "cn_24" in F else F["cn_22"], fill=MUTED)
        y += 205
    d.rectangle((72, 1136, 1008, 1228), fill=DARK, outline=DARK)
    d.text((112, 1166), "目标不是“写满”，是写到 HR 愿意继续看。", font=F["cn_30"], fill="#f7f8f8")
    footer_line(d, 4)
    return save(img, OUT2, "04-生成逻辑.png")


def v2_card5():
    img, d = mag_canvas()
    mag_header(d, "适合谁？", "跨行、校招、已有简历重写、作品型求职，都能用同一套事实优先逻辑。")
    grid = [("转行求职", "把旧经历翻译成新岗位能力"),
            ("校招实习", "从校园项目里提取职业证据"),
            ("作品型简历", "让链接进入经历，而不是堆在开头"),
            ("简历重写", "已有简历不够满、不够贴岗时重组")]
    for i, (a, b) in enumerate(grid):
        x = 72 + (i % 2) * 486
        y = 330 + (i // 2) * 310
        d.rectangle((x, y, x+448, y+250), fill=PAPER, outline=LINE, width=2)
        d.text((x+34, y+42), a, font=F["hei_46"], fill=INK)
        text_block(d, x+34, y+116, b, F["cn_24"] if "cn_24" in F else F["cn_22"], MUTED, 350, 8)
    d.rectangle((72, 1058, 1008, 1208), fill=DARK, outline=DARK)
    d.text((112, 1108), "让 HR 一眼看到：你真的有东西。", font=F["cn_38"] if "cn_38" in F else F["cn_36"], fill=MINT)
    footer_line(d, 5)
    return save(img, OUT2, "05-适合人群.png")


def contact_sheet(out_dir, name):
    imgs = [Image.open(p).resize((216, 288)) for p in sorted(out_dir.glob("0[1-5]-*.png"))]
    sheet = Image.new("RGB", (216*5 + 28*6, 288 + 56), "#f6f2ea")
    d = ImageDraw.Draw(sheet)
    for i, img in enumerate(imgs):
        x = 28 + i * (216 + 28)
        sheet.paste(img, (x, 28))
        d.rectangle((x, 28, x + 216, 316), outline=LINE, width=1)
    sheet.save(out_dir / name, quality=96)


if __name__ == "__main__":
    for p in OUT1.glob("*.png"):
        p.unlink()
    for p in OUT2.glob("*.png"):
        p.unlink()
    v1 = [v1_card1(), v1_card2(), v1_card3(), v1_card4(), v1_card5()]
    v2 = [v2_card1(), v2_card2(), v2_card3(), v2_card4(), v2_card5()]
    contact_sheet(OUT1, "00-总览.png")
    contact_sheet(OUT2, "00-总览.png")
    print("V1")
    print("\n".join(map(str, v1)))
    print("V2")
    print("\n".join(map(str, v2)))
