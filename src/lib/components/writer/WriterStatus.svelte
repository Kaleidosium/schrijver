<script lang="ts">
	interface Props {
		readonly saveLabel: string;
		readonly stats: string;
	}

	const { saveLabel, stats }: Props = $props();
</script>

<footer class="statusbar" aria-label="Draft status">
	<span>{stats}</span>
	<span>{saveLabel}</span>
</footer>
