1. Ngữ cảnh
   Tôi là 1 senior front-end engineer. Ngoài ra tôi cũng là 1 hộ kinh doanh bán hàng mỹ phẩm ngoài giờ hành chính. Tôi có sử dụng 1 số app bán hàng như KiotViet, Sapo, Nhanh.vn hoặc các ứng dụng khác liên quan để quản lý sản phẩm bán hàng (kho, thêm thông tin sản phẩm, lữu trữ khách hàng, thông tin và lên hóa đơn) để áp dụng cho việc bán hàng hóa. Tuy nhiên các app đang sử dụng là lưu trữ thông tin ở bên thứ 3 và phải trả phí rất cao. Nên tôi muốn xây dựng 1 trang web warehouse để tôi có thể quản lý sản phẩm, hóa đơn và thông tin của chính mình. Tất nhiên dưới dạng local và chỉ có mình tôi sử dụng. Không tính đến việc production chương trình.
   Nên cần thực hiện các yêu cầu sau để xây dựng 1 trang cms.
2. Yêu cầu hệ thống
   - Xây dựng 1 trang web tương tự như kho cá nhân để quản lý nguồn hàng, số lượng hàng hóa còn tồn của kho.
   - Trang web đầy đủ các tính năng cơ bản như thêm, sửa, xóa sản phẩm, số lượng và mô tả. (ảnh, tiêu đề, mô tả, số lượng, giá nhập, giá bạn, promotion)
   - Thêm kho thông tin khách hàng, khách thâm niên và thống kê doanh số theo từng khách hàng. (Tên khách hàng, số điện thoại, địa chỉ, số tiên đã tiêu, số bill trong tháng, quý, năm). Ngoài ra sắp xếp bill theo thứ tự số đơn hàng và doanh thu tổng.
   - Có 1 trang thống kê doanh số theo tháng, quý, năm để tổng hợp doanh thu lãi lỗ dựa trên giá gốc và giá trị đơn hàng.
   - Có chức năng lên bill để show preview gửi cho khách hàng để xác nhận sản phẩm và thanh toán (chỉ gửi bill confirm cho khách, không cần thanh toán)
   - Cần có 1 trang đăng nhập để xác nhận quyền truy cập vào hệ thống.
   - Có thể xây dựng 1 hệ thống database cơ bản để lưu và truy xuất thông tin (có cả backend và frontend)
3. Yêu cầu về front-end
   - Xây dựng 1 hệ thống web dùng react cơ bản cho các yêu cầu trên.
   - Thêm thư viện tailwind để styled.
   - Responsive cho ứng dụng mobile (iphone 11 - 17) và tabnet cơ bản.
   - Sử dụng các thư viện ngoài như mat-ui để làm đẹp giao diện người dùng.
   - Giao diện cần đảm bảo phù hợp và ưa nhìn, dễ dàng sử dụng
4. Yêu cầu về Backend
   - Nên có 1 hệ thống database để lưu trữ dữ liệu nhằm nâng cao bảo mật.
   - Ưu tiên hệ thống miễn phí và dễ sử dụng.
5. Yêu cầu chủ đạo tính năng
   - Thực hiện các yêu cầu cơ bản ở phần 2
   - Chức năng xem hóa đơn cần áp dụng cho các màn mobile để dễ dàng sử dụng khi lên đơn và chụp ảnh bill gửi khách.
   - Tham khảo ảnh bill được gửi kèm trong request
   - Tham khảo từ kho dữ liệu và ứng dụng để tự quyết định thiết kế và yêu cầu. (KiotViet, Sapo,... )
6. Trang web cho người Việt Nam sử dụng nên dùng ngôn ngữ tiếng Việt
7. Sau đó tôi sẽ đẩy lên git cá nhân và triển khai miễn phí để sử dụng lâu dài. Chỉ hướng cá nhân.
8. Cần có 1 file để lưu lại các thông tin admin như đăng nhập để lưu lại mỗi khi truy cập
