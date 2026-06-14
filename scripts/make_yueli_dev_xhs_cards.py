from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import textwrap

W, H = 1080, 1440
OUT = Path("/Users/mengwangran/Desktop/跃历小红书卡片-开发复盘")
OUT.mkdir(parents=True, exist_ok=True)

FONT_CN = "/System/Library/Fonts/Hiragino Sans GB.ttc"
FONT_HEI = "/System/Library/Fonts/STHeiti Medium.ttc"

BG = (244, 241, 234)
INK = (32, 32, 32)
MUTED = (101, 99, 92)
LINE = (205, 201, 190)
BLUE = (19, 68, 210)
RED = (153, 43, 43)
MINT = (181, 226, 205)
PAPER = (252, 251, 247)


def font(size, bold=False):
    path = FONT_HEI if bold else FONT_CN
    return ImageFont.truetype(path, size)


F = {
    "eyebrow": font(28, True),
    "title": font(82, True),
    "title2": font(64, True),
    "subtitle": font(36, True),
    "body": font(32),
    "body_bold": font(32, True),
    "small": font(24),
    "tiny": font(20),
    "num": font(30, True),
}


def draw_grid(d):
    for x in range(0, W, 72):
        d.line((x, 0, x, H), fill=(230, 227, 218), width=1)
    for y in range(0, H, 72):
        d.line((0, y, W, y), fill=(230, 227, 218), width=1)


def text_size(d, text, f):
    box = d.textbbox((0, 0), text, font=f)
    return box[2] - box[0], box[3] - box[1]


def wrap_cjk(text, max_px, f, d):
    lines = []
    for para in str(text).split("\n"):
        para = para.strip()
        if not para:
            lines.append("")
            continue
        line = ""
        for ch in para:
            test = line + ch
            if text_size(d, test, f)[0] <= max_px:
                line = test
            else:
                if line:
                    lines.append(line)
                line = ch
        if line:
            lines.append(line)
    return lines


def draw_textbox(d, xy, text, max_w, f, fill=INK, line_gap=12, max_lines=None):
    x, y = xy
    lines = wrap_cjk(text, max_w, f, d)
    if max_lines:
        lines = lines[:max_lines]
        if len(wrap_cjk(text, max_w, f, d)) > max_lines and lines:
            lines[-1] = lines[-1].rstrip("，。,. ") + "..."
    for line in lines:
        d.text((x, y), line, font=f, fill=fill)
        y += f.size + line_gap
    return y


def card_base(page, total=8):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    draw_grid(d)
    d.rectangle((54, 54, W - 54, H - 54), outline=LINE, width=2)
    d.text((72, 78), "跃历 / Career Leap", font=F["tiny"], fill=MUTED)
    d.text((W - 172, 78), f"{page:02d}/{total:02d}", font=F["tiny"], fill=MUTED)
    d.line((72, 122, W - 72, 122), fill=LINE, width=2)
    return img, d


def label(d, x, y, text, fill=INK, bg=PAPER):
    tw, th = text_size(d, text, F["small"])
    d.rectangle((x, y, x + tw + 26, y + th + 20), fill=bg, outline=LINE, width=2)
    d.text((x + 13, y + 8), text, font=F["small"], fill=fill)
    return x + tw + 40


def draw_footer(d, text="从零散经历到高匹配简历，只差一次跃历"):
    d.line((72, H - 130, W - 72, H - 130), fill=LINE, width=2)
    d.text((72, H - 96), text, font=F["tiny"], fill=MUTED)


def paste_image_cover(img, path, box):
    p = Path(path)
    if not p.exists():
        return
    src = Image.open(p).convert("RGB")
    x1, y1, x2, y2 = box
    bw, bh = x2 - x1, y2 - y1
    src.thumbnail((bw, bh))
    bg = Image.new("RGB", (bw, bh), PAPER)
    sx, sy = (bw - src.width) // 2, (bh - src.height) // 2
    bg.paste(src, (sx, sy))
    bg = bg.filter(ImageFilter.SHARPEN)
    img.paste(bg, (x1, y1))


def card_1():
    img, d = card_base(1)
    d.text((74, 178), "我用 AI", font=F["title"], fill=INK)
    d.text((74, 278), "做了一个", font=F["title"], fill=INK)
    d.text((74, 378), "AI 简历工具", font=F["title"], fill=BLUE)
    draw_textbox(
        d,
        (74, 520),
        "不是让 AI 写几句话，而是把零散经历变成一页能投递的 A4 简历。",
        900,
        F["subtitle"],
        fill=INK,
        line_gap=18,
        max_lines=2,
    )
    y = 690
    x = 74
    for t in ["FACT FIRST", "JD MATCH", "ONE PAGE A4", "STAR"]:
        x = label(d, x, y, t, fill=BLUE if t != "STAR" else RED)
    d.rectangle((74, 900, W - 74, 1180), fill=(28, 28, 28))
    d.text((116, 950), "跃历", font=font(108, True), fill=PAPER)
    d.text((116, 1080), "Career Leap", font=F["subtitle"], fill=MINT)
    draw_footer(d)
    return img


def card_2():
    img, d = card_base(2)
    d.text((74, 172), "为什么要做？", font=F["title2"], fill=INK)
    d.text((74, 266), "因为换岗位时，最麻烦的不是没有经历。", font=F["subtitle"], fill=INK)
    d.text((74, 365), "而是同一段经历，要被翻译成目标岗位听得懂的语言。", font=F["subtitle"], fill=BLUE)
    y = 535
    blocks = [
        ("运营", "用户增长 / 活动策划 / 数据复盘"),
        ("产品", "需求拆解 / 用户洞察 / 项目推进"),
        ("市场", "品牌表达 / 资源整合 / 传播效果"),
    ]
    for role, desc in blocks:
        d.rectangle((74, y, W - 74, y + 145), fill=PAPER, outline=LINE, width=2)
        d.text((112, y + 42), role, font=F["subtitle"], fill=BLUE)
        d.text((250, y + 46), desc, font=F["body"], fill=INK)
        y += 174
    draw_footer(d)
    return img


def card_3():
    img, d = card_base(3)
    d.text((74, 170), "普通 AI vs 跃历", font=F["title2"], fill=INK)
    d.text((74, 270), "普通 AI 给你文字，跃历给你结果。", font=F["subtitle"], fill=BLUE)
    d.rectangle((74, 390, W // 2 - 22, 1030), fill=(35, 35, 35))
    d.rectangle((W // 2 + 22, 390, W - 74, 1030), fill=PAPER, outline=LINE, width=2)
    d.text((112, 430), "使用前", font=F["subtitle"], fill=PAPER)
    draw_textbox(d, (112, 535), "整理经历 → 问 Chatbot → 复制文案 → 找模板 → 调排版 → 导出后继续返工", 390, F["body"], fill=(224, 224, 218), line_gap=18)
    d.text((W // 2 + 60, 430), "使用跃历", font=F["subtitle"], fill=BLUE)
    draw_textbox(d, (W // 2 + 60, 535), "上传素材 → 输入岗位/JD → AI 筛选重组 → STAR 改写 → 一页 A4 PDF", 390, F["body"], fill=INK, line_gap=18)
    d.text((112, 1120), "AI 只帮你写中间一小段。", font=F["body_bold"], fill=RED)
    d.text((W // 2 + 60, 1120), "跃历交付完整工作流。", font=F["body_bold"], fill=BLUE)
    draw_footer(d)
    return img


def card_4():
    img, d = card_base(4)
    d.text((74, 170), "开发过程", font=F["title2"], fill=INK)
    d.text((74, 266), "从 Claude Code 的 MVP，到 Codex 里的产品化打磨。", font=F["subtitle"], fill=BLUE)
    steps = [
        ("01", "想清楚交互", "左边编辑，右边 A4 预览；选中文字后让 AI 局部改写。"),
        ("02", "先跑通 MVP", "纯前端 + DeepSeek + 文件解析 + PDF 导出，快速看见工具雏形。"),
        ("03", "转向产品化", "修进度条、API 代理、多文件上传、PDF 一致性和隐私提示。"),
    ]
    y = 430
    for num, title, body in steps:
        d.text((76, y), num, font=font(58, True), fill=BLUE)
        d.text((188, y + 5), title, font=F["subtitle"], fill=INK)
        draw_textbox(d, (188, y + 64), body, 760, F["body"], fill=MUTED, line_gap=12)
        y += 245
    draw_footer(d)
    return img


def card_5():
    img, d = card_base(5)
    d.text((74, 170), "我踩过的坑", font=F["title2"], fill=INK)
    d.text((74, 266), "AI demo 很容易，AI 产品很难。", font=F["subtitle"], fill=RED)
    pits = [
        ("缓存地狱", "代码改了，浏览器还在跑旧 JS。"),
        ("一次性生成不稳定", "AI 容易照抄原文，经历分类也会乱。"),
        ("总是不满一页", "简历看起来稀，用户会觉得自己不够厉害。"),
        ("导出不一致", "预览好看，不代表 PDF 一定好看。"),
        ("编辑体验打架", "选中、加粗、AI 改写、拖动排序会互相抢状态。"),
        ("隐私样例", "默认展示不能暴露真实姓名、公司和经历。"),
    ]
    y = 405
    for i, (a, b) in enumerate(pits, 1):
        d.rectangle((74, y, W - 74, y + 105), fill=PAPER, outline=LINE, width=2)
        d.text((106, y + 28), f"{i}", font=F["num"], fill=RED)
        d.text((168, y + 20), a, font=F["body_bold"], fill=INK)
        d.text((450, y + 24), b, font=F["small"], fill=MUTED)
        y += 125
    draw_footer(d, "先踩坑，才知道产品真正该补什么。")
    return img


def card_6():
    img, d = card_base(6)
    d.text((74, 170), "我的收获", font=F["title2"], fill=INK)
    d.text((74, 266), "这些坑最后都变成了产品规则。", font=F["subtitle"], fill=BLUE)
    learnings = [
        ("交付物要明确", "用户要的不是建议，而是一页可投递 A4 PDF。"),
        ("Prompt 要流程化", "先提取事实，再筛选能力，最后生成和排版。"),
        ("规则要产品化", "事实优先、实习优先、STAR、一页 A4 都要内置。"),
        ("状态就是信任感", "加载、失败、恢复、导出都要给用户明确反馈。"),
        ("AI 写代码很快", "但审美、取舍和用户感受，还是要人来判断。"),
    ]
    y = 420
    for title, body in learnings:
        d.text((76, y), "—", font=F["subtitle"], fill=BLUE)
        d.text((128, y), title, font=F["body_bold"], fill=INK)
        draw_textbox(d, (128, y + 52), body, 780, F["body"], fill=MUTED, line_gap=10, max_lines=2)
        y += 155
    draw_footer(d)
    return img


def card_7():
    img, d = card_base(7)
    d.text((74, 170), "跃历的方法论", font=F["title2"], fill=INK)
    d.text((74, 266), "不是“AI 帮我写简历”，而是把好简历标准放进流程。", font=F["subtitle"], fill=BLUE)
    items = [
        ("FACT FIRST", "不编造公司、时间、奖项和数据。"),
        ("JD MATCH", "根据目标岗位筛选和重组经历。"),
        ("STAR", "把行动、结果和岗位能力写清楚。"),
        ("ONE PAGE A4", "默认生成一页高密度可投递简历。"),
    ]
    y = 430
    for tag, body in items:
        d.rectangle((74, y, W - 74, y + 140), fill=PAPER, outline=LINE, width=2)
        d.text((112, y + 38), tag, font=F["subtitle"], fill=BLUE if tag != "STAR" else RED)
        d.text((430, y + 43), body, font=F["body"], fill=INK)
        y += 172
    draw_footer(d)
    return img


def card_8():
    img, d = card_base(8)
    d.text((74, 170), "下一步", font=F["title2"], fill=INK)
    d.text((74, 266), "继续降低用户决策成本。", font=F["subtitle"], fill=BLUE)
    future = [
        "不知道投什么岗位？上传经历后反向推荐方向。",
        "作品链接读取：让 GitHub / Demo 自然进入简历。",
        "JD 截图 OCR：不用再手动复制招聘信息。",
        "账号与历史保存：为不同岗位保存不同版本。",
    ]
    y = 405
    for line in future:
        d.text((96, y), "•", font=F["subtitle"], fill=RED)
        y = draw_textbox(d, (145, y), line, 800, F["body_bold"], fill=INK, line_gap=12, max_lines=2) + 32
    d.rectangle((74, 1030, W - 74, 1215), fill=(28, 28, 28))
    d.text((112, 1072), "从零散经历到高匹配简历", font=F["subtitle"], fill=PAPER)
    d.text((112, 1140), "只差一次跃历。", font=font(48, True), fill=MINT)
    draw_footer(d, "普通 AI 给你文字，跃历给你一份能投递的结果。")
    return img


CARDS = [card_1, card_2, card_3, card_4, card_5, card_6, card_7, card_8]


def write_script_md():
    md = """# 跃历小红书卡片文案｜开发复盘版

风格参考：baoyu-xhs-images + guizang-social-card-skill  
比例：1080×1440，小红书 3:4  
逻辑：为什么做 → 差异 → 开发过程 → 踩坑 → 收获 → 方法论 → 下一步

## 01 封面
我用 AI 做了一个 AI 简历工具。不是让 AI 写几句话，而是把零散经历变成一页能投递的 A4 简历。

## 02 为什么做
换岗位时，最麻烦的不是没有经历，而是同一段经历要被翻译成目标岗位听得懂的语言。

## 03 普通 AI vs 跃历
普通 AI 给你文字，跃历给你结果。前者只完成中间一小段，后者交付完整简历工作流。

## 04 开发过程
从 Claude Code 的 MVP，到 Codex 里的产品化打磨：先跑通，再修用户真正会卡住的细节。

## 05 我踩过的坑
缓存、一次性生成不稳定、不满一页、PDF 导出不一致、编辑体验冲突、隐私样例。

## 06 我的收获
交付物要明确；Prompt 要流程化；规则要产品化；状态就是信任感；AI 写代码很快，但审美和判断仍然要人来做。

## 07 跃历的方法论
FACT FIRST / JD MATCH / STAR / ONE PAGE A4，把好简历标准放进流程。

## 08 下一步
岗位推荐、作品链接读取、JD 截图 OCR、账号与历史保存。继续降低用户决策成本。
"""
    (OUT / "跃历小红书卡片文案-开发复盘版.md").write_text(md, encoding="utf-8")


def main():
    for i, fn in enumerate(CARDS, 1):
        img = fn()
        path = OUT / f"{i:02d}.png"
        img.save(path, quality=95)
    write_script_md()
    print(f"saved {len(CARDS)} cards to {OUT}")


if __name__ == "__main__":
    main()
