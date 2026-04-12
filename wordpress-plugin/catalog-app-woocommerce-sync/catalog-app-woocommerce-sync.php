<?php
/**
 * Plugin Name: Catalog App WooCommerce Sync
 * Plugin URI: https://example.com/
 * Description: Sync products and inventory between WooCommerce and your external catalog app using API keys.
 * Version: 1.0.0
 * Author: OpenAI Codex
 * Requires Plugins: woocommerce
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: catalog-app-woocommerce-sync
 */

if (! defined('ABSPATH')) {
	exit;
}

if (! class_exists('Catalog_App_WooCommerce_Sync')) {
	final class Catalog_App_WooCommerce_Sync {
		const OPTION_KEY = 'catalog_app_wc_sync_settings';
		const LOG_OPTION_KEY = 'catalog_app_wc_sync_logs';
		const CRON_HOOK = 'catalog_app_wc_sync_cron';
		const NONCE_ACTION = 'catalog_app_wc_sync_now';
		const MAX_LOG_ENTRIES = 200;

		private static $instance = null;
		private $suppress_outbound = 0;

		public static function instance() {
			if (null === self::$instance) {
				self::$instance = new self();
			}

			return self::$instance;
		}

		public static function activate() {
			if (! class_exists('WooCommerce')) {
				deactivate_plugins(plugin_basename(__FILE__));
				wp_die(esc_html__('WooCommerce must be installed and active before activating this plugin.', 'catalog-app-woocommerce-sync'));
			}

			$instance = self::instance();
			$settings = $instance->get_settings();
			$instance->schedule_event($settings);
		}

		public static function deactivate() {
			wp_clear_scheduled_hook(self::CRON_HOOK);
		}

		private function __construct() {
			add_action('plugins_loaded', array($this, 'bootstrap'));
		}

		public function bootstrap() {
			if (! class_exists('WooCommerce')) {
				add_action('admin_notices', array($this, 'render_missing_woocommerce_notice'));
				return;
			}

			add_action('admin_menu', array($this, 'register_admin_menu'));
			add_action('admin_init', array($this, 'register_settings'));
			add_action('admin_post_catalog_app_wc_sync_now', array($this, 'handle_manual_sync'));
			add_action(self::CRON_HOOK, array($this, 'handle_cron_sync'));
			add_action('update_option_' . self::OPTION_KEY, array($this, 'handle_settings_update'), 10, 2);
			add_action('woocommerce_product_set_stock', array($this, 'handle_stock_change'));
			add_action('save_post_product', array($this, 'handle_product_save'), 20, 3);
		}

		public function render_missing_woocommerce_notice() {
			echo '<div class="notice notice-error"><p>';
			echo esc_html__('Catalog App WooCommerce Sync requires WooCommerce to be active.', 'catalog-app-woocommerce-sync');
			echo '</p></div>';
		}

		public function register_admin_menu() {
			add_submenu_page(
				'woocommerce',
				__('Catalog App Sync', 'catalog-app-woocommerce-sync'),
				__('Catalog App Sync', 'catalog-app-woocommerce-sync'),
				'manage_woocommerce',
				'catalog-app-woocommerce-sync',
				array($this, 'render_admin_page')
			);
		}

		public function register_settings() {
			register_setting(
				'catalog_app_wc_sync_settings_group',
				self::OPTION_KEY,
				array($this, 'sanitize_settings')
			);

			add_settings_section(
				'catalog_app_wc_sync_connection',
				__('Connection', 'catalog-app-woocommerce-sync'),
				'__return_false',
				'catalog-app-woocommerce-sync'
			);

			$this->add_settings_field('api_base_url', __('API Base URL', 'catalog-app-woocommerce-sync'));
			$this->add_settings_field('client_slug', __('Client Slug', 'catalog-app-woocommerce-sync'));
			$this->add_settings_field('api_key', __('API Key', 'catalog-app-woocommerce-sync'), 'password');
			$this->add_settings_field('import_status', __('Imported Product Status', 'catalog-app-woocommerce-sync'), 'select', array(
				'publish' => __('Publish', 'catalog-app-woocommerce-sync'),
				'draft' => __('Draft', 'catalog-app-woocommerce-sync'),
			));
			$this->add_settings_field('auto_sync_enabled', __('Enable Scheduled Pull Sync', 'catalog-app-woocommerce-sync'), 'checkbox');
			$this->add_settings_field('sync_interval', __('Sync Interval', 'catalog-app-woocommerce-sync'), 'select', array(
				'hourly' => __('Hourly', 'catalog-app-woocommerce-sync'),
				'twicedaily' => __('Twice Daily', 'catalog-app-woocommerce-sync'),
				'daily' => __('Daily', 'catalog-app-woocommerce-sync'),
			));
			$this->add_settings_field('push_stock_enabled', __('Push Woo Stock Changes to Catalog App', 'catalog-app-woocommerce-sync'), 'checkbox');
			$this->add_settings_field('push_product_updates_enabled', __('Push Woo Product Updates to Catalog App', 'catalog-app-woocommerce-sync'), 'checkbox');
		}

		private function add_settings_field($key, $label, $type = 'text', $choices = array()) {
			add_settings_field(
				$key,
				$label,
				array($this, 'render_settings_field'),
				'catalog-app-woocommerce-sync',
				'catalog_app_wc_sync_connection',
				array(
					'key' => $key,
					'type' => $type,
					'choices' => $choices,
				)
			);
		}

		public function render_settings_field($args) {
			$settings = $this->get_settings();
			$key = $args['key'];
			$type = $args['type'];
			$name = self::OPTION_KEY . '[' . $key . ']';
			$value = isset($settings[$key]) ? $settings[$key] : '';

			if ('checkbox' === $type) {
				printf(
					'<label><input type="checkbox" name="%1$s" value="1" %2$s /> %3$s</label>',
					esc_attr($name),
					checked(! empty($value), true, false),
					esc_html__('Enabled', 'catalog-app-woocommerce-sync')
				);
				return;
			}

			if ('select' === $type) {
				echo '<select name="' . esc_attr($name) . '">';
				foreach ($args['choices'] as $choice_value => $choice_label) {
					printf(
						'<option value="%1$s" %2$s>%3$s</option>',
						esc_attr($choice_value),
						selected($value, $choice_value, false),
						esc_html($choice_label)
					);
				}
				echo '</select>';
				return;
			}

			printf(
				'<input type="%1$s" name="%2$s" value="%3$s" class="regular-text" autocomplete="off" />',
				esc_attr($type),
				esc_attr($name),
				esc_attr($value)
			);
		}

		public function sanitize_settings($input) {
			$current = $this->get_settings();
			$sanitized = $current;

			$sanitized['api_base_url'] = isset($input['api_base_url']) ? untrailingslashit(esc_url_raw(trim($input['api_base_url']))) : '';
			$sanitized['client_slug'] = isset($input['client_slug']) ? sanitize_title($input['client_slug']) : '';
			$sanitized['api_key'] = isset($input['api_key']) ? sanitize_text_field(trim($input['api_key'])) : '';
			$sanitized['import_status'] = (isset($input['import_status']) && in_array($input['import_status'], array('publish', 'draft'), true)) ? $input['import_status'] : 'draft';
			$sanitized['auto_sync_enabled'] = ! empty($input['auto_sync_enabled']) ? 1 : 0;
			$sanitized['sync_interval'] = (isset($input['sync_interval']) && in_array($input['sync_interval'], array('hourly', 'twicedaily', 'daily'), true)) ? $input['sync_interval'] : 'hourly';
			$sanitized['push_stock_enabled'] = ! empty($input['push_stock_enabled']) ? 1 : 0;
			$sanitized['push_product_updates_enabled'] = ! empty($input['push_product_updates_enabled']) ? 1 : 0;

			return $sanitized;
		}

		public function handle_settings_update($old_value, $value) {
			$this->schedule_event(wp_parse_args($value, $this->get_default_settings()));
		}

		private function get_default_settings() {
			return array(
				'api_base_url' => '',
				'client_slug' => '',
				'api_key' => '',
				'import_status' => 'draft',
				'auto_sync_enabled' => 0,
				'sync_interval' => 'hourly',
				'push_stock_enabled' => 0,
				'push_product_updates_enabled' => 0,
				'last_sync_at' => '',
				'last_sync_result' => '',
			);
		}

		private function get_settings() {
			return wp_parse_args(get_option(self::OPTION_KEY, array()), $this->get_default_settings());
		}

		private function save_settings($settings) {
			update_option(self::OPTION_KEY, $settings);
		}

		private function schedule_event($settings) {
			wp_clear_scheduled_hook(self::CRON_HOOK);

			if (empty($settings['auto_sync_enabled'])) {
				return;
			}

			if (! wp_next_scheduled(self::CRON_HOOK)) {
				wp_schedule_event(time() + 60, $settings['sync_interval'], self::CRON_HOOK);
			}
		}

		public function render_admin_page() {
			if (! current_user_can('manage_woocommerce')) {
				return;
			}

			$settings = $this->get_settings();
			$logs = array_reverse($this->get_logs());
			$manual_sync_url = wp_nonce_url(
				admin_url('admin-post.php?action=catalog_app_wc_sync_now'),
				self::NONCE_ACTION
			);
			?>
			<div class="wrap">
				<h1><?php echo esc_html__('Catalog App WooCommerce Sync', 'catalog-app-woocommerce-sync'); ?></h1>
				<p><?php echo esc_html__('Use your catalog app API key and client slug to pull products into WooCommerce and optionally push changes back.', 'catalog-app-woocommerce-sync'); ?></p>

				<?php if (! empty($_GET['sync_message'])) : ?>
					<div class="notice notice-success is-dismissible"><p><?php echo esc_html(wp_unslash($_GET['sync_message'])); ?></p></div>
				<?php endif; ?>

				<form method="post" action="options.php">
					<?php
					settings_fields('catalog_app_wc_sync_settings_group');
					do_settings_sections('catalog-app-woocommerce-sync');
					submit_button(__('Save Settings', 'catalog-app-woocommerce-sync'));
					?>
				</form>

				<hr />

				<h2><?php echo esc_html__('Manual Sync', 'catalog-app-woocommerce-sync'); ?></h2>
				<p>
					<a href="<?php echo esc_url($manual_sync_url); ?>" class="button button-primary">
						<?php echo esc_html__('Sync Now', 'catalog-app-woocommerce-sync'); ?>
					</a>
				</p>
				<p><?php echo esc_html__('Last sync time:', 'catalog-app-woocommerce-sync'); ?> <strong><?php echo esc_html($settings['last_sync_at'] ? $settings['last_sync_at'] : __('Never', 'catalog-app-woocommerce-sync')); ?></strong></p>
				<p><?php echo esc_html__('Last sync result:', 'catalog-app-woocommerce-sync'); ?> <strong><?php echo esc_html($settings['last_sync_result'] ? $settings['last_sync_result'] : __('No sync has run yet.', 'catalog-app-woocommerce-sync')); ?></strong></p>

				<h2><?php echo esc_html__('Recent Logs', 'catalog-app-woocommerce-sync'); ?></h2>
				<table class="widefat striped">
					<thead>
						<tr>
							<th><?php echo esc_html__('Time', 'catalog-app-woocommerce-sync'); ?></th>
							<th><?php echo esc_html__('Level', 'catalog-app-woocommerce-sync'); ?></th>
							<th><?php echo esc_html__('Message', 'catalog-app-woocommerce-sync'); ?></th>
						</tr>
					</thead>
					<tbody>
					<?php if (empty($logs)) : ?>
						<tr><td colspan="3"><?php echo esc_html__('No logs yet.', 'catalog-app-woocommerce-sync'); ?></td></tr>
					<?php else : ?>
						<?php foreach ($logs as $entry) : ?>
							<tr>
								<td><?php echo esc_html($entry['time']); ?></td>
								<td><?php echo esc_html(strtoupper($entry['level'])); ?></td>
								<td><?php echo esc_html($entry['message']); ?></td>
							</tr>
						<?php endforeach; ?>
					<?php endif; ?>
					</tbody>
				</table>
			</div>
			<?php
		}

		public function handle_manual_sync() {
			if (! current_user_can('manage_woocommerce')) {
				wp_die(esc_html__('You do not have permission to run this sync.', 'catalog-app-woocommerce-sync'));
			}

			check_admin_referer(self::NONCE_ACTION);

			$result = $this->run_pull_sync(true);
			$message = $result['message'];

			wp_safe_redirect(
				add_query_arg(
					'sync_message',
					$message,
					admin_url('admin.php?page=catalog-app-woocommerce-sync')
				)
			);
			exit;
		}

		public function handle_cron_sync() {
			$this->run_pull_sync(false);
		}

		private function run_pull_sync($is_manual) {
			$settings = $this->get_settings();

			if (! $this->is_configured($settings)) {
				$message = __('Sync skipped because the plugin is not fully configured.', 'catalog-app-woocommerce-sync');
				$this->log('warning', $message);
				return array('success' => false, 'message' => $message);
			}

			if (get_transient('catalog_app_wc_sync_lock')) {
				$message = __('Another sync is already running.', 'catalog-app-woocommerce-sync');
				$this->log('warning', $message);
				return array('success' => false, 'message' => $message);
			}

			set_transient('catalog_app_wc_sync_lock', 1, 10 * MINUTE_IN_SECONDS);
			$this->suppress_outbound++;

			$page = 1;
			$total_processed = 0;
			$total_created = 0;
			$total_updated = 0;
			$errors = array();
			$updated_after = $settings['last_sync_at'];

			try {
				do {
					$query_args = array(
						'page' => $page,
						'limit' => 50,
						'includeInactive' => 'true',
					);

					if (! empty($updated_after)) {
						$query_args['updatedAfter'] = $updated_after;
					}

					$response = $this->api_request(
						'GET',
						'/api/public/sync/products',
						array(
							'query' => $query_args,
						)
					);

					if (is_wp_error($response)) {
						throw new Exception($response->get_error_message());
					}

					$products = isset($response['data']['products']) ? $response['data']['products'] : array();
					$pagination = isset($response['data']['pagination']) ? $response['data']['pagination'] : array();

					foreach ($products as $remote_product) {
						$sync_result = $this->upsert_wc_product($remote_product, $settings);
						if ($sync_result['created']) {
							$total_created++;
						}
						if ($sync_result['updated']) {
							$total_updated++;
						}
						$total_processed++;
					}

					$page++;
					$has_next_page = ! empty($pagination['hasNextPage']);
				} while ($has_next_page);

				$settings['last_sync_at'] = gmdate('c');
				$settings['last_sync_result'] = sprintf(
					/* translators: 1: processed count, 2: created count, 3: updated count */
					__('Processed %1$d products. Created %2$d, updated %3$d.', 'catalog-app-woocommerce-sync'),
					$total_processed,
					$total_created,
					$total_updated
				);
				$this->save_settings($settings);

				$this->log('info', $settings['last_sync_result']);
				return array('success' => true, 'message' => $settings['last_sync_result']);
			} catch (Exception $exception) {
				$errors[] = $exception->getMessage();
				$message = $is_manual
					? sprintf(__('Sync failed: %s', 'catalog-app-woocommerce-sync'), $exception->getMessage())
					: sprintf(__('Scheduled sync failed: %s', 'catalog-app-woocommerce-sync'), $exception->getMessage());
				$settings['last_sync_result'] = $message;
				$this->save_settings($settings);
				$this->log('error', $message);
				return array('success' => false, 'message' => $message, 'errors' => $errors);
			} finally {
				$this->suppress_outbound = max(0, $this->suppress_outbound - 1);
				delete_transient('catalog_app_wc_sync_lock');
			}
		}

		private function upsert_wc_product($remote_product, $settings) {
			$sku = isset($remote_product['sku']) ? wc_clean($remote_product['sku']) : '';
			if ('' === $sku) {
				throw new Exception(__('Encountered a remote product without an SKU.', 'catalog-app-woocommerce-sync'));
			}

			$product_id = wc_get_product_id_by_sku($sku);
			$created = false;
			$updated = false;

			if ($product_id) {
				$product = wc_get_product($product_id);
				if (! $product instanceof WC_Product_Simple) {
					$product = new WC_Product_Simple($product_id);
				}
				$updated = true;
			} else {
				$product = new WC_Product_Simple();
				$product->set_sku($sku);
				$created = true;
			}

			$product->set_name(isset($remote_product['name']) ? $remote_product['name'] : $sku);
			$product->set_description(isset($remote_product['description']) ? wp_kses_post($remote_product['description']) : '');
			$product->set_regular_price(isset($remote_product['price']) ? (string) $remote_product['price'] : '0');
			$product->set_manage_stock(true);
			$product->set_stock_quantity(isset($remote_product['stockLevel']) ? (int) $remote_product['stockLevel'] : 0);
			$product->set_stock_status(((int) $product->get_stock_quantity()) > 0 ? 'instock' : 'outofstock');
			$product->set_catalog_visibility('visible');
			$product->set_status(! empty($remote_product['isActive']) ? $settings['import_status'] : 'draft');

			$category_name = ! empty($remote_product['category']) ? sanitize_text_field($remote_product['category']) : 'Uncategorized';
			$term_id = $this->ensure_product_category($category_name);
			if ($term_id) {
				$product->set_category_ids(array($term_id));
			}

			$product->update_meta_data('_catalog_app_external_id', isset($remote_product['id']) ? sanitize_text_field($remote_product['id']) : '');
			$product->update_meta_data('_catalog_app_last_external_updated_at', isset($remote_product['updatedAt']) ? sanitize_text_field($remote_product['updatedAt']) : '');
			$product->update_meta_data('_catalog_app_source', 'catalog_app');
			$product->save();

			$images = isset($remote_product['images']) && is_array($remote_product['images']) ? $remote_product['images'] : array();
			if (empty($images) && ! empty($remote_product['thumbnailUrl'])) {
				$images = array(
					array(
						'id' => isset($remote_product['id']) ? sanitize_text_field($remote_product['id']) . '-thumbnail' : '',
						'url' => esc_url_raw($remote_product['thumbnailUrl']),
					),
				);
			}
			$this->sync_product_images($product->get_id(), $images);

			return array(
				'created' => $created,
				'updated' => $updated,
				'product_id' => $product->get_id(),
			);
		}

		private function ensure_product_category($category_name) {
			$term = term_exists($category_name, 'product_cat');
			if (0 === $term || null === $term) {
				$term = wp_insert_term($category_name, 'product_cat');
			}

			if (is_wp_error($term)) {
				$this->log('warning', 'Failed to ensure product category "' . $category_name . '": ' . $term->get_error_message());
				return 0;
			}

			return is_array($term) ? (int) $term['term_id'] : (int) $term;
		}

		private function sync_product_images($product_id, $images) {
			if (! function_exists('download_url')) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
				require_once ABSPATH . 'wp-admin/includes/media.php';
				require_once ABSPATH . 'wp-admin/includes/image.php';
			}

			$gallery_ids = array();
			$featured_image_id = 0;
			$seen_attachment_ids = array();

			foreach ($images as $image) {
				if (empty($image['url'])) {
					continue;
				}

				$attachment_id = 0;
				$remote_media_id = ! empty($image['id']) ? sanitize_text_field($image['id']) : '';
				$remote_url = esc_url_raw($image['url']);

				if ($remote_media_id) {
					$attachment_id = $this->get_attachment_id_by_remote_media_id($remote_media_id);
				}

				if (! $attachment_id) {
					$attachment_id = $this->get_attachment_id_by_remote_url($remote_url);
				}

				if (! $attachment_id) {
					$attachment_id = $this->import_remote_image($remote_url, $product_id, $remote_media_id);
					if (is_wp_error($attachment_id)) {
						$this->log('warning', 'Image import failed for product #' . $product_id . ': ' . $attachment_id->get_error_message());
						continue;
					}
				}

				$attachment_id = (int) $attachment_id;
				if (in_array($attachment_id, $seen_attachment_ids, true)) {
					continue;
				}

				$seen_attachment_ids[] = $attachment_id;

				if ($remote_media_id) {
					update_post_meta($attachment_id, '_catalog_app_remote_media_id', $remote_media_id);
				}
				update_post_meta($attachment_id, '_catalog_app_remote_url', $remote_url);

				if (0 === $featured_image_id) {
					$featured_image_id = $attachment_id;
				} else {
					$gallery_ids[] = $attachment_id;
				}
			}

			if ($featured_image_id) {
				set_post_thumbnail($product_id, $featured_image_id);
			}

			update_post_meta($product_id, '_product_image_gallery', implode(',', array_map('absint', $gallery_ids)));
		}

		private function get_attachment_id_by_remote_media_id($remote_media_id) {
			$query = new WP_Query(
				array(
					'post_type' => 'attachment',
					'post_status' => 'inherit',
					'posts_per_page' => 1,
					'fields' => 'ids',
					'meta_query' => array(
						array(
							'key' => '_catalog_app_remote_media_id',
							'value' => sanitize_text_field($remote_media_id),
						),
					),
				)
			);

			return ! empty($query->posts) ? (int) $query->posts[0] : 0;
		}

		private function get_attachment_id_by_remote_url($remote_url) {
			$query = new WP_Query(
				array(
					'post_type' => 'attachment',
					'post_status' => 'inherit',
					'posts_per_page' => 1,
					'fields' => 'ids',
					'meta_query' => array(
						array(
							'key' => '_catalog_app_remote_url',
							'value' => esc_url_raw($remote_url),
						),
					),
				)
			);

			return ! empty($query->posts) ? (int) $query->posts[0] : 0;
		}

		private function import_remote_image($remote_url, $product_id, $remote_media_id = '') {
			$temp_file = download_url($remote_url, 30);
			if (is_wp_error($temp_file)) {
				return $temp_file;
			}

			$path = wp_parse_url($remote_url, PHP_URL_PATH);
			$filename = $path ? wp_basename($path) : '';
			if (! $filename) {
				$filename = $remote_media_id ? 'catalog-app-' . $remote_media_id . '.jpg' : 'catalog-app-image.jpg';
			}

			$file_array = array(
				'name' => sanitize_file_name($filename),
				'tmp_name' => $temp_file,
			);

			$attachment_id = media_handle_sideload($file_array, $product_id);
			if (is_wp_error($attachment_id)) {
				@unlink($temp_file);
				return $attachment_id;
			}

			return (int) $attachment_id;
		}

		public function handle_stock_change($product) {
			if ($this->suppress_outbound > 0) {
				return;
			}

			$settings = $this->get_settings();
			if (empty($settings['push_stock_enabled']) || ! $this->is_configured($settings)) {
				return;
			}

			if (! $product instanceof WC_Product) {
				return;
			}

			$sku = $product->get_sku();
			if (! $sku) {
				return;
			}

			$stock_quantity = $product->get_stock_quantity();
			if (null === $stock_quantity) {
				return;
			}

			$response = $this->api_request(
				'POST',
				'/api/public/sync/inventory/set',
				array(
					'body' => array(
						'items' => array(
							array(
								'sku' => $sku,
								'stockLevel' => (int) $stock_quantity,
								'reason' => 'WooCommerce stock change',
							),
						),
					),
				)
			);

			if (is_wp_error($response)) {
				$this->log('error', 'Stock push failed for SKU ' . $sku . ': ' . $response->get_error_message());
				return;
			}

			$this->log('info', 'Pushed stock level for SKU ' . $sku . ' to catalog app.');
		}

		public function handle_product_save($post_id, $post, $update) {
			if (! $update || $this->suppress_outbound > 0) {
				return;
			}

			if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
				return;
			}

			if (wp_is_post_revision($post_id) || ! current_user_can('edit_post', $post_id)) {
				return;
			}

			$settings = $this->get_settings();
			if (empty($settings['push_product_updates_enabled']) || ! $this->is_configured($settings)) {
				return;
			}

			$product = wc_get_product($post_id);
			if (! $product instanceof WC_Product || ! $product->get_sku()) {
				return;
			}

			$category_name = '';
			$category_ids = $product->get_category_ids();
			if (! empty($category_ids)) {
				$term = get_term($category_ids[0], 'product_cat');
				if ($term && ! is_wp_error($term)) {
					$category_name = $term->name;
				}
			}

			$payload = array(
				'products' => array(
					array(
						'sku' => $product->get_sku(),
						'name' => $product->get_name(),
						'description' => $product->get_description(),
						'price' => (float) $product->get_regular_price(),
						'stockLevel' => (int) wc_stock_amount($product->get_stock_quantity()),
						'minStock' => (int) get_post_meta($post_id, '_low_stock_amount', true),
						'category' => $category_name,
						'isActive' => 'publish' === $product->get_status(),
					),
				),
			);

			$response = $this->api_request('POST', '/api/public/sync/products/upsert', array('body' => $payload));
			if (is_wp_error($response)) {
				$this->log('error', 'Product push failed for SKU ' . $product->get_sku() . ': ' . $response->get_error_message());
				return;
			}

			$this->log('info', 'Pushed product update for SKU ' . $product->get_sku() . ' to catalog app.');
		}

		private function api_request($method, $path, $args = array()) {
			$settings = $this->get_settings();
			if (! $this->is_configured($settings)) {
				return new WP_Error('catalog_app_sync_not_configured', __('Catalog App Sync settings are incomplete.', 'catalog-app-woocommerce-sync'));
			}

			$query = isset($args['query']) ? $args['query'] : array();
			$query['client'] = $settings['client_slug'];
			$url = $settings['api_base_url'] . $path . '?' . http_build_query($query);

			$request_args = array(
				'method' => strtoupper($method),
				'timeout' => 30,
				'headers' => array(
					'Accept' => 'application/json',
					'Content-Type' => 'application/json',
					'x-api-key' => $settings['api_key'],
				),
			);

			if (isset($args['body'])) {
				$request_args['body'] = wp_json_encode($args['body']);
			}

			$response = wp_remote_request($url, $request_args);
			if (is_wp_error($response)) {
				return $response;
			}

			$status_code = wp_remote_retrieve_response_code($response);
			$body = wp_remote_retrieve_body($response);
			$data = json_decode($body, true);

			if ($status_code < 200 || $status_code >= 300) {
				$message = isset($data['error']) ? $data['error'] : ('Unexpected API error with status ' . $status_code);
				return new WP_Error('catalog_app_sync_api_error', $message, array('status_code' => $status_code, 'body' => $body));
			}

			return is_array($data) ? $data : array();
		}

		private function is_configured($settings) {
			return ! empty($settings['api_base_url']) && ! empty($settings['client_slug']) && ! empty($settings['api_key']);
		}

		private function log($level, $message) {
			$logs = $this->get_logs();
			$logs[] = array(
				'time' => current_time('mysql'),
				'level' => sanitize_key($level),
				'message' => wp_strip_all_tags((string) $message),
			);

			if (count($logs) > self::MAX_LOG_ENTRIES) {
				$logs = array_slice($logs, -1 * self::MAX_LOG_ENTRIES);
			}

			update_option(self::LOG_OPTION_KEY, $logs, false);
		}

		private function get_logs() {
			$logs = get_option(self::LOG_OPTION_KEY, array());
			return is_array($logs) ? $logs : array();
		}
	}

	Catalog_App_WooCommerce_Sync::instance();
	register_activation_hook(__FILE__, array('Catalog_App_WooCommerce_Sync', 'activate'));
	register_deactivation_hook(__FILE__, array('Catalog_App_WooCommerce_Sync', 'deactivate'));
}
