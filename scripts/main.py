import csv
import os
import sys
import pymysql
import ip
import re
import ip_txt_to_csv
import c_class_scan_new
import nmapScan
import nuclei
import xlsx_to_csv
import neo4j_command
import attack_graph_gen
import extract_info_P
import A2B
import C_produck
import xml.etree.ElementTree as ET
import datetime

def extract_scan_info(inputfile):
    """
    读取 Nmap XML 输出，提取扫描信息（包括 reason、extrainfo、conf、cpe、portused 详情，OS Match 的 osclass 列表等），
    并写入“结果.txt”，返回 (scanning_ip, result_content)
    """
    try:
        tree = ET.parse(inputfile)
    except ET.ParseError as e:
        print(f"解析 XML 文件时出错: {e}")
        return "", ""

    root = tree.getroot()

    # --- Host 部分 ---
    host = root.find('.//host')
    if host is None:
        print("未找到 host 元素，跳过后续处理。")
        return "", ""

    # IP 和 Addresses
    scanning_ip = ""
    addresses = {}
    addr_el = host.find('address[@addrtype="ipv4"]')
    if addr_el is not None:
        scanning_ip = addr_el.get('addr', '')
        addresses['ipv4'] = scanning_ip
    else:
        print("未找到 IPv4 地址，跳过后续处理。")
        return "", ""

    # Hostnames
    hostnames = []
    for hn in host.findall('.//hostnames/hostname'):
        hostnames.append({
            'name': hn.get('name', ''),
            'type': hn.get('type', '')
        })

    # Status
    status = {}
    st = host.find('status')
    if st is not None:
        status['state'] = st.get('state', '')
        status['reason'] = st.get('reason', '')
    else:
        status['state'] = "无"
        status['reason'] = "无"

    # Vendor（XML 中无此信息，保留空 dict）
    vendor = {}

    # --- TCP Ports 部分 ---
    tcp_ports = {}
    for p in host.findall('.//ports/port[@protocol="tcp"]'):
        portid = p.get('portid', '')
        if not portid:
            continue

        state_el = p.find('state')
        svc_el = p.find('service')

        entry = {
            'state': state_el.get('state', '') if state_el is not None else '',
            'reason': state_el.get('reason', '') if state_el is not None else '',
            'name': svc_el.get('name', '') if svc_el is not None else '',
            'product': svc_el.get('product', '') if svc_el is not None else '',
            'version': svc_el.get('version', '') if svc_el is not None else '',
            'extrainfo': svc_el.get('extrainfo', '') if svc_el is not None else '',
            'conf': svc_el.get('conf', '') if svc_el is not None else '',
            'cpe': svc_el.findtext('cpe', default='') if svc_el is not None else ''
        }

        # 脚本输出
        scripts = {}
        for sc in p.findall('script'):
            sid = sc.get('id', '')
            out = sc.get('output', '').replace('\r\n', '\n')
            # 如果有子 elem
            for elem in sc.findall('.//elem'):
                text = ET.tostring(elem, encoding='unicode', method='text').strip()
                out += '\n' + text
            scripts[sid] = out.strip('\n')
        if scripts:
            entry['script'] = scripts

        tcp_ports[portid] = entry

    # --- Port Used 部分 ---
    portused = []
    for pu in root.findall('.//os/portused'):
        portused.append({
            'state': pu.get('state', ''),
            'proto': pu.get('proto', ''),
            'portid': pu.get('portid', '')
        })

    # --- OS Match 部分 ---
    osmatch = []
    for om in root.findall('.//os/osmatch'):
        om_entry = {
            'name': om.get('name', ''),
            'accuracy': om.get('accuracy', ''),
            'line': om.get('line', ''),
            'osclass': []
        }
        for oc in om.findall('osclass'):
            oc_entry = {
                'type': oc.get('type', ''),
                'vendor': oc.get('vendor', ''),
                'osfamily': oc.get('osfamily', ''),
                'osgen': oc.get('osgen', ''),
                'accuracy': oc.get('accuracy', ''),
                'cpe': [c.text for c in oc.findall('cpe')]
            }
            om_entry['osclass'].append(oc_entry)
        osmatch.append(om_entry)

    # --- 生成输出 ---
    lines = []
    lines.append("扫描结果")
    lines.append("=" * 40)
    lines.append(f"Scanning IP: {scanning_ip}\n")

    # Hostnames
    lines.append("Hostnames:")
    for h in hostnames:
        lines.append(f"  - {h}")
    lines.append("")

    # Addresses
    lines.append("Addresses:")
    for k, v in addresses.items():
        lines.append(f"  {k}: {v}")
    lines.append("")

    # Status
    lines.append("Status:")
    for k, v in status.items():
        lines.append(f"  {k}: {v}")
    lines.append("")

    # Vendor
    lines.append("Vendor:")
    lines.append(f"  {vendor}")
    lines.append("")

    # TCP Ports
    lines.append("TCP Ports:")
    for port, info in tcp_ports.items():
        lines.append(f"\nPort {port}:")
        for key in ['state', 'reason', 'name', 'product', 'version', 'extrainfo', 'conf', 'cpe']:
            lines.append(f"  {key}: {info.get(key, '')}")
        if 'script' in info:
            lines.append("  Script outputs:")
            for sid, out in info['script'].items():
                lines.append(f"    {sid}:")
                for l in out.splitlines():
                    lines.append(f"      {l}")
    lines.append("")

    # Port Used
    lines.append("Port Used:")
    for pu in portused:
        lines.append(f"  - {pu}")
    lines.append("")

    # OS Match
    lines.append("OS Match:")
    for om in osmatch:
        lines.append(f"  - {om}")
    lines.append("")

    result_content = "\n".join(lines)
    # 检查“数据”文件夹是否存在，如果不存在则创建
    if not os.path.exists("数据"):
        os.makedirs("数据")

    # 将结果保存到“数据”文件夹中的“结果.txt”文件
    with open("数据/结果.txt", "w", encoding="utf-8") as f:
        f.write(result_content)

    print("扫描信息提取完成，结果已保存至“数据/结果.txt”")
    return scanning_ip, result_content

def extract_output_info(target_ip, filename):
    """
    读取 output.txt 文件，提取IP地址与 target_ip 相同的记录块，
    每个记录块之间以“————————————”分隔
    """
    if not os.path.exists(filename):
        print("未找到 output.txt 文件。")
        return ""

    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    # 根据分隔符拆分记录块
    blocks = content.split("————————————")
    matching_blocks = []
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        # 查找块中“IP地址：”后面的值
        for line in block.splitlines():
            if line.startswith("IP地址："):
                ip = line.split("：", 1)[1].strip()
                if ip == target_ip:
                    matching_blocks.append(block)
                break
    if matching_blocks:
        return "\n\n".join(matching_blocks)
    else:
        return ""

#判断节点是三种类型中的哪一种，返回类型
def classify_ip(inputfile):
    # 读取整个文件内容
    with open(inputfile, 'r', encoding='utf-8') as file:
        content = file.read()

    # 查找特征标签
    start_marker = "特征标签："
    end_marker = "\n"
    start_pos = content.find(start_marker)
    if start_pos == -1:
        return "Middle"  # 如果找不到特征标签，直接返回Middle

    start_pos += len(start_marker)
    end_pos = content.find(end_marker, start_pos)

    if end_pos == -1:
        features = content[start_pos:].strip()
    else:
        features = content[start_pos:end_pos].strip()

    # 分类逻辑
    if "Guard" in features:
        return "Guard"
    elif "Exit" in features:
        return "Exit"
    else:
        return "Middle"

def imsql(inputfile, host, user, password, database, port):
    try:
        conn = pymysql.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            port=port,
            charset='utf8mb4'
        )
    except pymysql.Error as e:
        print(f"连接数据库失败: {e}")
        return

    cursor = conn.cursor()
    try:
        with open(inputfile, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"未找到文件: {inputfile}")
        cursor.close()
        conn.close()
        return

    ip_match = re.search(r"Scanning IP:\s*([\d\.]+)", content)
    ip = ip_match.group(1) if ip_match else "无"

    # 提取 Hostnames 部分
    hostname_name = "无"
    hostname_type = "无"
    host_match = re.search(r"Hostnames:\s*\n\s*-\s*\{([^}]+)\}", content)
    if host_match:
        host_str = host_match.group(1)
        name_match = re.search(r"'name':\s*'([^']+)'", host_str)
        type_match = re.search(r"'type':\s*'([^']+)'", host_str)
        if name_match:
            hostname_name = name_match.group(1)
        if type_match:
            hostname_type = type_match.group(1)

    state_match = re.search(r"state:\s*(\S+)", content)
    reason_match = re.search(r"reason:\s*(\S+)", content)
    os_match = re.search(r"OS Match:\s+- \{(.*?)}", content, re.DOTALL)

    status_state = state_match.group(1) if state_match else "无"
    status_reason = reason_match.group(1) if reason_match else "无"
    os_info = os_match.group(1) if os_match else "无"

    out_section = ""
    out_match = re.search(r"txt中匹配的记录：(.*)", content, re.DOTALL)
    if out_match:
        out_section = out_match.group(1)

    def get_field(field_name):
        m = re.search(field_name + r"：(?:\w+=)?(.+)", out_section)
        return m.group(1).strip() if m else "无"

    dirport = get_field("DirPort端口")
    orport = get_field("ORPort端口")
    microdesc = get_field("微描述摘要散列")
    feature = get_field("特征标签")
    tor_version = get_field("Tor版本")
    protocol_version = get_field("协议版本")
    nickname = get_field("昵称")
    identity = get_field("身份哈希值密钥")
    IP = get_field("IP地址")
    b = re.search(r"带宽估计值\(KB/s\)：Bandwidth=(\d+)", out_section)
    bandwidth = b.group(1).strip() if b else "无"
    release_date = get_field("发布时间（日期）")
    release_time = get_field("发布时间（时间）")

    #时间戳
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    #获取节点类型
    category = classify_ip(inputfile)
    try:
        #cursor.execute("INSERT IGNORE INTO Torprofile (IP, name, type, nikename, release_date, release_time, ORPort, DirPort, des_hash, fea_label, Tor_ver, protocol_ver, width_rec, status_state, status_reason, OS, microdesc) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", (IP, hostname_name, hostname_type, nickname, release_date, release_time, orport, dirport, identity, feature, tor_version, protocol_version, bandwidth, status_state, status_reason, os_info, microdesc))
        cursor.execute("INSERT IGNORE INTO Torprofile (IP, name, type, nikename, release_date, release_time, ORPort, DirPort, des_hash, fea_label, Tor_ver, protocol_ver, width_rec, status_state, status_reason, OS, microdesc, time, category) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %)", (IP, hostname_name, hostname_type, nickname, release_date, release_time, orport, dirport, identity, feature, tor_version, protocol_version, bandwidth, status_state, status_reason, os_info, microdesc, current_time, category))
    except pymysql.Error as e:
        print(f"插入 Torprofile 表失败: {e}")

    tcp_ports = []
    tcp_block = re.search(r"TCP Ports:\s*\n(.*?)\nPort Used:", content, re.DOTALL)
    if tcp_block:
        block = tcp_block.group(1)
        port_blocks = re.split(r"\n(?=Port )", block)
        for pb in port_blocks:
            lines = pb.splitlines()
            port_num = "无"
            if lines:
                m = re.match(r"[ \t]*Port\s+(\d+):", lines[0])
                if m:
                    port_num = m.group(1).strip()
            fields = {}
            for line in lines:
                line = line.strip()
                if ":" in line:
                    key, val = line.split(":", 1)
                    key = key.lower()
                    fields[key] = val.strip() if val.strip() != "" else "无"
            state = fields.get("state", "无")
            reason = fields.get("reason", "无")
            name = fields.get("name", "无")
            product = fields.get("product", "无")
            version = fields.get("version", "无")
            extrainfo = fields.get("extrainfo", "无")
            conf = fields.get("conf", "无")
            cpe = fields.get("cpe", "无")
            try:
                #cursor.execute("INSERT IGNORE INTO totport (IP, port_num, port_state, reason, name, product, version, extrainfo, conf, cpe) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", (IP, port_num, state, reason, name, product, version, extrainfo, conf, cpe))
                cursor.execute(
                    "INSERT IGNORE INTO totport (IP, port_num, port_state, reason, name, product, version, extrainfo, conf, cpe, time) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (IP, port_num, state, reason, name, product, version, extrainfo, conf, cpe, current_time))
            except pymysql.Error as e:
                print(f"插入 totport 表失败: {e}")

    conn.commit()
    cursor.close()
    conn.close()
def replace_dot_with_underscore(text):
    if text.endswith('.txt'):
        text = text[:-4]  # Remove the last 4 characters ('.txt')
    return text.replace('.', '_')
def read_alive_ips(csv_file, source_ip):
    """读取CSV文件，提取源IP对应的存活C段IP"""
    alive_ips = []
    # 构建完整路径，假设文件在"数据"文件夹内
    folder_path = './数据/'  # "数据"文件夹路径
    full_file_path = os.path.join(folder_path, csv_file)  # 拼接完整路径

    # 检查文件是否存在
    if not os.path.exists(full_file_path):
        print(f"错误: 文件 {full_file_path} 不存在")
        return alive_ips

    print(f"正在读取文件 {full_file_path}...")

    try:
        with open(full_file_path, 'r') as file:
            reader = csv.reader(file)
            header = next(reader, None)  # 跳过表头并保存它（如果存在）

            # 检查表头是否正确
            if not header or len(header) < 3:
                print(f"警告: 文件 {full_file_path} 的表头格式不正确")
                return alive_ips

            print("表头已读取，开始处理数据...")

            for row in reader:
                if row and row[0] == source_ip and row[2] == 'TRUE':  # 判断是否存活
                    alive_ips.append(row[1])  # 存活的C段IP

            # 输出处理结果
            if alive_ips:
                print(f"找到 {len(alive_ips)} 个存活的C段IP")
            else:
                print(f"没有找到源IP {source_ip} 的存活C段IP")

    except Exception as e:
        print(f"读取文件时发生错误: {e}")

    return alive_ips
def main(inputfile, filename):
    # 提取扫描示例.txt中的信息，生成结果.txt
    scanning_ip, result_content = extract_scan_info(inputfile)
    if not scanning_ip:
        print("未能提取到扫描 IP，终止程序。")
        return ""

    # 从 output.txt 中提取与扫描 IP 匹配的信息
    output_info = extract_output_info(scanning_ip, filename)
    if output_info:
        combined_content = result_content + "\n\n" + "output.txt中匹配的记录：" + "\n" + "=" * 40 + "\n\n" + output_info
    else:
        combined_content = result_content + "\n\n" + "在output.txt中未找到与该IP匹配的记录。"

    # 创建“数据”文件夹（如果不存在）
    data_folder = "数据"
    if not os.path.exists(data_folder):
        os.makedirs(data_folder)
        print(f"创建文件夹: {data_folder}")

    # 将最终结果写入“数据”文件夹中的文件，文件名以 IP 地址命名
    output_filename = f"{scanning_ip}.txt"
    output_file_path = os.path.join(data_folder, output_filename)
    with open(output_file_path, "w", encoding="utf-8") as f:
        f.write(combined_content)
    print(f"最终结果已保存至“{output_file_path}”")
    return output_file_path

if __name__ == '__main__':
    ip.main("output.txt", "output_family.txt")
    ip_txt_to_csv.extract_ips("数据/output.txt","数据/target_ip.csv")

    continue_scanning = True

    while continue_scanning:
        # 运行 nmap 扫描
        if os.path.exists("数据/target_ip.csv") and os.path.getsize("数据/target_ip.csv") == 0:
            print("文件为空，退出循环")
            continue_scanning = False
            break
        c_class_scan_new.scan_first_ip_c_class("数据/target_ip.csv", "数据")
        result = nmapScan.main("数据/target_ip.csv", "数据")

        #nuclei.run_nuclei_scan("104.53.221.159")
        sqlfile = main("数据/nmap_scan_result.xml", "数据/output.txt")
        if sqlfile:
            imsql(sqlfile, "172.20.10.11", "testtest", "123123", "fortest", 3306)
            xlsx_to_csv.main(sqlfile)
            neo4j_command.execute_queries()
            pass
        file_name=os.path.basename(sqlfile)
        if file_name.endswith('.txt'):
            file_name = file_name[:-4]  # Remove the last 4 characters ('.txt')
        modified_text = replace_dot_with_underscore(file_name)
        csv_file=modified_text + "_c.csv"
        alive_ips = read_alive_ips(csv_file, file_name)
        print(alive_ips)

        # 对每个存活的IP进行处理
        for ip in alive_ips:
            ip=replace_dot_with_underscore(ip)
            sqlfile = main(f"数据/nmap_scan_{ip}.xml", f"数据/output.txt")
            if sqlfile:
                imsql(sqlfile, "172.20.10.11", "testtest", "123123", "fortest", 3306)
                xlsx_to_csv.main(sqlfile)
                neo4j_command.execute_queries()
                pass