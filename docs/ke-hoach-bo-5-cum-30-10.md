# Kế hoạch bê toàn bộ sang Omyn theo 5 cụm: Nhân sự · Tài chính · Bán hàng · Marketing · Kho (chị Lâm 30/10)

Ba nguồn: **AMIA OS** (98 trang/151 bảng, đọc trong `amia-os`), **e-global-ops** (81 bảng/43 màn, chỉ tham khảo bộ khung, không dữ liệu thật), **Lark HR** (79 bảng, `mapping-lark-hr.md`). Mỗi lát 15–20 phút = bảng + màn + quyền + test. Giao diện tối giản như lướt Facebook: ô thêm nhanh, thẻ gọn, bấm một lần.
Ký hiệu: ✔ đã lên main · ◐ có khung/chưa có màn · ✘ chưa làm.

## 1. NHÂN SỰ
| Chức năng | Nguồn | Omyn |
|---|---|---|
| Hồ sơ, hồ sơ của tôi, khối/phòng ban, chức danh | AMIA, Lark | ✔ |
| Tuyển dụng: tin, ứng viên, kênh, yêu cầu, mục tiêu, ngân sách, phỏng vấn, offer, đề xuất duyệt | AMIA, Lark, e-global(kênh) | ✔ |
| Onboarding 60 ngày + đánh giá thử việc 30/60 | AMIA, Lark | ✔ |
| Hợp đồng LĐ + đánh giá tái ký | AMIA, Lark 1.3–1.5 | ✔ |
| Chấm công, bảng công tháng, ngày lễ, đơn từ & phê duyệt | AMIA, Lark | ✔ |
| Bảng lương, phiếu lương, thỏa thuận lương | AMIA | ✔ (điều kiện lương ✘) |
| KPI thi đua ngày/tháng/quý + thưởng, thông báo nhắc | yêu cầu chị | ✔ |
| Công việc (thêm nhanh, số lượng, lặp ngày) | e-global daily/operational task | ✔ (việc con, người cộng tác, bảng theo dõi ✘) |
| BSC & mục tiêu cá nhân | e-global strategy_* | ◐ khung dữ liệu+cấu hình; bản đồ, nhập số liệu tháng, mục tiêu của tôi ✘ |
| Chuông thông báo trong app | yêu cầu chị | ✘ |
| Ca kíp, lịch làm việc | AMIA | ✘ |
| Nghỉ việc + checklist bàn giao, khảo sát nghỉ việc | AMIA, Lark | ✘ |
| Quỹ phép, lịch nghỉ phép, đăng ký nghỉ tháng, làm thêm giờ, điều chỉnh công | AMIA, Lark | ✘ |
| Lộ trình thăng tiến, thưởng phạt, thuế TNCN, eNPS, tài sản cấp phát | Lark | ✘ |
| Trang Lịch nhân sự (HĐ đến hạn, sinh nhật, nghỉ phép, hết thử việc) | AMIA | ✘ |
| Nơi làm việc: báo cáo ngày, đề xuất, phê duyệt, việc, wiki; Quy trình/SOP; Văn bản | AMIA | ✘ |
| Cài đặt: vai trò tuỳ chỉnh, chính sách duyệt, bảng tin, điểm thưởng | AMIA | ✘ |
| Email tự động từ CV tới pass phỏng vấn | chị dặn | ✘ (chờ nguồn gửi) |
| Thư viện KPI tháng (đơn vị, mục tiêu, KPI nhân viên theo tháng) | e-global | ✘ |
| Báo cáo phân nhóm, quyền xem toàn công ty cho lãnh đạo | Lark 7.x | ✘ |

## 2. TÀI CHÍNH
| Chức năng | Nguồn | Omyn |
|---|---|---|
| Sổ quỹ, công nợ khách, đối soát, hóa đơn đầu vào, khoá kỳ, ngân sách, quyết toán hoa hồng | AMIA `tai-chinh` | ✘ |
| Công nợ nhà cung cấp | AMIA `kho-mua-sam/cong-no` | ✘ |
| Kế hoạch tài chính: kế hoạch, dòng, giá trị, giả định kịch bản, hoà vốn, KPI tài chính + dashboard, nhập số, khoá sửa (19 màn) | e-global `Planning` | ✘ |
| Chi phí cố định, mục tiêu doanh thu | e-global `Settings` | ✘ |
| Sổ thu chi Omyn (hiện chị Flora ghi ngoài app) | Flora | ✘ |
| Chi phí quảng cáo vào kế hoạch | e-global | ◐ có số chi phí QC |

## 3. BÁN HÀNG
| Chức năng | Nguồn | Omyn |
|---|---|---|
| Khách hàng: danh sách, chi tiết, nhóm, chăm sóc, gần đây, tái khám, thẻ sắp hết, thống kê, tư vấn | AMIA `khach-hang`(9), e-global | ✘ |
| Bán hàng/thu ngân, hóa đơn, in hoá đơn, huỷ đơn | AMIA | ✘ |
| Đơn bán + chi tiết + chi nhánh + nhập Excel | e-global | ✘ |
| Thẻ dịch vụ/liệu trình, phiếu cấp, hoa hồng & doanh thu | AMIA | ✘ |
| Lịch hẹn, đặt lịch | AMIA | ✘ |
| Khiếu nại + biên chứng | AMIA | ✘ |
| Điểm thưởng, voucher | AMIA `cai-dat` | ✘ |
| Báo cáo ngày (doanh số ngày tự sinh) | e-global | ✘ |
| Đơn hàng Shopee | e-global-style | ◐ bảng đơn + doanh thu ngày, kéo khi có khoá |

## 4. MARKETING
| Chức năng | Nguồn | Omyn |
|---|---|---|
| Quảng cáo Facebook + TikTok (tài khoản→chiến dịch→nhóm→QC, số ngày) | e-global, AMIA | ✔ khung + trang; kéo thật khi có khoá |
| Shopee: gian hàng, đơn, doanh thu, chi phí QC | chị Lâm | ✔ khung + trang |
| Breakdown theo tuổi/giới/vùng/vị trí, tài sản QC (ảnh/video) | e-global | ✘ |
| Fanpage, trụ cột, góc nội dung, ngành/ngành con, bài nội dung, link tham chiếu, mã tham chiếu | e-global | ✘ |
| Chiến dịch, đối tác (KOC), lead, link theo dõi, nội dung, báo cáo marketing | AMIA `marketing`(8) | ✘ |
| Việc vận hành nội dung (lịch đăng, duyệt bài) | e-global operational task | ◐ nền Công việc đã có |

## 5. KHO
| Chức năng | Nguồn | Omyn |
|---|---|---|
| Sản phẩm: nhóm SP, SP, thuộc tính, phản hồi SP, nhập/xuất Excel | e-global `Inventory`(10), AMIA | ✘ |
| Tồn kho, chuyển kho, kiểm kê, xử lý hàng | AMIA `kho`(5) | ✘ |
| Mua hàng/đơn nhập, nhà cung cấp, công nợ NCC | AMIA `kho-mua-sam`(5), e-global | ✘ |
| Định mức, danh mục | AMIA | ✘ |

## Thứ tự làm đề xuất (mỗi lát 15–20 phút)
1. **Nhân sự còn lại** ~22 lát: BSC giao diện (3), chuông (1), Lịch nhân sự (1), nghỉ việc+bàn giao (2), quỹ phép+lịch nghỉ+OT+điều chỉnh công (4), ca kíp (1), thăng tiến+thưởng phạt (2), thuế TNCN+eNPS+tài sản (3), nơi làm việc+quy trình+văn bản (4), cài đặt vai trò/duyệt/bảng tin (1).
2. **Danh mục dùng chung trước** (sản phẩm + chi nhánh + khách) ~5 lát, vì bán hàng, kho, tài chính đều dựa vào.
3. **Bán hàng** ~14 lát. 4. **Kho** ~8 lát. 5. **Tài chính** ~22 lát (kế hoạch tài chính 8, sổ quỹ/công nợ/đối soát 8, còn lại). 6. **Marketing còn lại** ~10 lát.
Tổng ~80 lát, khoảng 24–27 giờ làm liền; chia 2–3 phiên song song thì còn 1–1,5 ngày. Migration: phiên HR 0020–0029, phiên Ops 0030+ (đã dùng 0030–0032).
